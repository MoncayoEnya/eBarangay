// src/hooks/useBarangayConfig.js
// Reads the active barangay from Firestore settings and exposes
// real sitios, GPS points, and map bounds for that barangay.
// Every page that needs location dropdowns imports from here.

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  CEBU_BARANGAYS,
  CEBU_BARANGAY_NAMES,
  getSitios,
  getGPSPoints,
  getMapBounds,
} from '../data/cebuBarangays';

const SETTINGS_DOC = 'barangay_profile';
const SETTINGS_COL = 'settings';

export const useBarangayConfig = () => {
  const [barangayName, setBarangayName] = useState('');
  const [loading,      setLoading]      = useState(true);

  // Subscribe to settings doc so changes in Settings page propagate instantly
  useEffect(() => {
    const ref = doc(db, SETTINGS_COL, SETTINGS_DOC);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const name = data.barangayName || '';
        setBarangayName(name);
        // Cache in localStorage for instant reads before Firestore responds
        if (name) localStorage.setItem('active_barangay', name);
      } else {
        // Fallback: use localStorage cache
        const cached = localStorage.getItem('active_barangay') || '';
        setBarangayName(cached);
      }
      setLoading(false);
    }, () => {
      const cached = localStorage.getItem('active_barangay') || '';
      setBarangayName(cached);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const config = CEBU_BARANGAYS[barangayName] || null;

  // Sitios as plain string array for dropdowns
  const sitios = config ? getSitios(barangayName) : [];

  // Sitios with 'All' option for filter dropdowns
  const sitiosWithAll = ['All Areas', ...sitios];

  // GPS points for map (includes MRF and hall)
  const gpsPoints = config ? getGPSPoints(barangayName) : [];

  // Map bounds for the canvas renderer
  const mapBounds = config ? getMapBounds(barangayName) : {
    latMin: 10.29, latMax: 10.36, lngMin: 123.88, lngMax: 123.92,
  };

  // Center coords
  const center = config?.center || { lat: 10.3157, lng: 123.8910 };

  // Save a new barangay selection to Firestore
  const selectBarangay = useCallback(async (name) => {
    try {
      await setDoc(
        doc(db, SETTINGS_COL, SETTINGS_DOC),
        { barangayName: name, updatedAt: serverTimestamp() },
        { merge: true }
      );
      localStorage.setItem('active_barangay', name);
    } catch (e) {
      console.error('selectBarangay:', e);
    }
  }, []);

  return {
    barangayName,           // 'Lahug', 'Apas', etc.
    config,                 // full CEBU_BARANGAYS[name] object
    sitios,                 // ['Mahayahay', 'Upper Lahug', ...]
    sitiosWithAll,          // ['All Areas', 'Mahayahay', ...]
    gpsPoints,              // [{lat, lng, label, type}, ...]
    mapBounds,              // {latMin, latMax, lngMin, lngMax}
    center,                 // {lat, lng}
    loading,
    selectBarangay,         // (name: string) => Promise<void>
    allBarangays: CEBU_BARANGAY_NAMES,  // all available barangay names
  };
};

export default useBarangayConfig;