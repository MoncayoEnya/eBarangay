// src/components/map/BarangayMap.jsx
// Real interactive map — Leaflet + OpenStreetMap tiles, no API key.
// Features:
//   - Real street map tiles
//   - "You Are Here" blue dot from browser GPS
//   - Sitio/Hall/MRF pins with popups
//   - Optimized route polyline with numbered stops
//   - Legend

import React, { useEffect, useRef, useState } from 'react';
import { Loader, AlertTriangle, Navigation } from 'lucide-react';

const PIN_SVGS = {
  hall:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 34" width="26" height="34"><path d="M13 0C8.03 0 4 4.03 4 9c0 5.77 9 18 9 18s9-12.23 9-18c0-4.97-4.03-9-9-9z" fill="#1d4ed8" stroke="#fff" stroke-width="1.5"/><circle cx="13" cy="9" r="4" fill="#fff"/></svg>',
  mrf:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 34" width="26" height="34"><path d="M13 0C8.03 0 4 4.03 4 9c0 5.77 9 18 9 18s9-12.23 9-18c0-4.97-4.03-9-9-9z" fill="#d97706" stroke="#fff" stroke-width="1.5"/><text x="13" y="13" font-size="7" text-anchor="middle" fill="#fff" font-weight="bold" font-family="sans-serif">MRF</text></svg>',
  flood: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 34" width="26" height="34"><path d="M13 0C8.03 0 4 4.03 4 9c0 5.77 9 18 9 18s9-12.23 9-18c0-4.97-4.03-9-9-9z" fill="#dc2626" stroke="#fff" stroke-width="1.5"/><text x="13" y="13" font-size="12" text-anchor="middle" fill="#fff" font-weight="bold" font-family="sans-serif">!</text></svg>',
  sitio: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 30" width="22" height="30"><path d="M11 0C6.93 0 3.67 3.27 3.67 7.33C3.67 12.17 11 22 11 22s7.33-9.83 7.33-14.67C18.33 3.27 15.07 0 11 0z" fill="#059669" stroke="#fff" stroke-width="1.5"/><circle cx="11" cy="7.5" r="3" fill="#fff"/></svg>',
};

const toDataUrl = (svg) => 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

// Haversine formula — accurate km distance between two GPS points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function BarangayMap({
  barangayName = '',
  points       = [],
  center       = { lat: 10.3157, lng: 123.8910 },
  mode         = 'view',
  height       = 420,
  onPointClick = null,
  routePoints  = [],
  showRoute    = false,
  showMyLocation = true,
}) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const routeRef   = useRef(null);
  const myLocRef   = useRef(null);
  const [ready,    setReady]    = useState(!!window.L);
  const [error,    setError]    = useState(null);
  const [myLoc,    setMyLoc]    = useState(null);
  const [locErr,   setLocErr]   = useState('');
  const [locating, setLocating] = useState(false);

  // ── Load Leaflet CSS + JS from CDN ──────────────────────────────────────
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script     = document.createElement('script');
    script.src     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload  = () => setReady(true);
    script.onerror = () => setError('Map library failed to load. Check internet connection.');
    document.head.appendChild(script);
  }, []);

  // ── Initialize map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || leafletRef.current) return;
    try {
      const L   = window.L;
      const map = L.map(mapRef.current, {
        center:          [center.lat, center.lng],
        zoom:            15,
        zoomControl:     true,
        scrollWheelZoom: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      leafletRef.current = map;
    } catch (e) {
      setError('Map init failed: ' + e.message);
    }
  }, [ready]);

  // ── Re-center when barangay changes ─────────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], 15, { animate: true });
  }, [center.lat, center.lng]);

  // ── Draw sitio/hall/mrf markers ─────────────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current;
    const L   = window.L;
    if (!map || !L) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    points.forEach(point => {
      const isHall    = point.type === 'hall';
      const isMRF     = point.type === 'mrf';
      const isFlood   = point.floodRisk;

      const pinKey = isHall ? 'hall' : isMRF ? 'mrf' : isFlood ? 'flood' : 'sitio';
      const sz     = isHall || isMRF ? [26, 34] : [22, 30];

      const icon = L.icon({
        iconUrl:     toDataUrl(PIN_SVGS[pinKey]),
        iconSize:    sz,
        iconAnchor:  [sz[0]/2, sz[1]],
        popupAnchor: [0, -sz[1]],
      });

      const badge = isFlood
        ? '<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:inline-block;margin-top:4px">Flood Risk</span>'
        : isHall
        ? '<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:inline-block;margin-top:4px">Barangay Hall</span>'
        : isMRF
        ? '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:inline-block;margin-top:4px">MRF Facility</span>'
        : '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;display:inline-block;margin-top:4px">Sitio</span>';

      const popup = L.popup({ maxWidth: 230 }).setContent(
        `<div style="font-family:sans-serif;padding:2px 0">
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:2px">${point.label||point.name||''}</div>
          ${badge}
          <div style="font-size:12px;color:#64748b;margin-top:6px">${barangayName ? 'Brgy. '+barangayName+', Cebu City' : 'Cebu City'}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">GPS: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}</div>
        </div>`
      );

      const marker = L.marker([point.lat, point.lng], { icon }).bindPopup(popup);
      if (onPointClick) marker.on('click', () => onPointClick(point));
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    if (points.length > 1) {
      try {
        const bounds = window.L.latLngBounds(points.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (_) {}
    }
  }, [points, barangayName, onPointClick]);

  // ── Draw route polyline ─────────────────────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current;
    const L   = window.L;
    if (!map || !L) return;

    if (routeRef.current) { map.removeLayer(routeRef.current); routeRef.current = null; }

    if (showRoute && routePoints.length >= 2) {
      const latlngs = routePoints.map(p => [p.lat, p.lng]);

      routeRef.current = L.polyline(latlngs, {
        color:     '#3b82f6',
        weight:    5,
        opacity:   0.9,
        dashArray: '12, 7',
        lineJoin:  'round',
      }).addTo(map);

      // Numbered stop markers on the route
      routePoints.forEach((pt, i) => {
        const bg = i === 0 ? '#10b981' : i === routePoints.length - 1 ? '#f59e0b' : '#3b82f6';
        const stopIcon = L.divIcon({
          className: '',
          html: `<div style="width:24px;height:24px;border-radius:50%;background:${bg};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);font-family:sans-serif">${i+1}</div>`,
          iconSize:   [24, 24],
          iconAnchor: [12, 12],
        });
        const m = L.marker([pt.lat, pt.lng], { icon: stopIcon })
          .bindTooltip(`<b>${i+1}. ${pt.label||'Stop '+(i+1)}</b>`, { permanent: false, direction: 'top', offset: [0, -14] })
          .addTo(map);
        markersRef.current.push(m);
      });

      try {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
      } catch (_) {}
    }
  }, [routePoints, showRoute]);

  // ── "You Are Here" — real browser GPS ───────────────────────────────────
  useEffect(() => {
    const map = leafletRef.current;
    const L   = window.L;
    if (!map || !L || !showMyLocation) return;

    // Remove old location marker
    if (myLocRef.current) { map.removeLayer(myLocRef.current); myLocRef.current = null; }
    if (!myLoc) return;

    // Pulsing blue dot
    const youIcon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:20px;height:20px">
        <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.25;animation:pulse-ring 1.5s ease-out infinite"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:#2563eb;border:2.5px solid #fff;box-shadow:0 0 0 2px #3b82f6"></div>
      </div>`,
      iconSize:   [20, 20],
      iconAnchor: [10, 10],
    });

    myLocRef.current = L.marker([myLoc.lat, myLoc.lng], { icon: youIcon, zIndexOffset: 1000 })
      .bindPopup(
        `<div style="font-family:sans-serif;padding:2px 0">
          <div style="font-size:14px;font-weight:700;color:#1d4ed8;margin-bottom:4px">You Are Here</div>
          <div style="font-size:12px;color:#64748b">Accuracy: ~${Math.round(myLoc.accuracy)}m</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">GPS: ${myLoc.lat.toFixed(5)}, ${myLoc.lng.toFixed(5)}</div>
        </div>`, { maxWidth: 200 }
      )
      .addTo(map)
      .openPopup();

    // Also draw accuracy circle
    const circle = L.circle([myLoc.lat, myLoc.lng], {
      radius:      myLoc.accuracy,
      color:       '#3b82f6',
      fillColor:   '#3b82f6',
      fillOpacity: 0.08,
      weight:      1,
    }).addTo(map);
    markersRef.current.push(circle);

  }, [myLoc, showMyLocation]);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
    };
  }, []);

  // ── Get user location ────────────────────────────────────────────────────
  const locateMe = () => {
    if (!navigator.geolocation) { setLocErr('Geolocation not supported by your browser.'); return; }
    setLocating(true); setLocErr('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setMyLoc(loc);
        setLocating(false);
        // Pan map to user location
        if (leafletRef.current) {
          leafletRef.current.setView([loc.lat, loc.lng], 16, { animate: true });
        }
      },
      (err) => {
        setLocating(false);
        const msgs = {
          1: 'Location permission denied. Please allow location access in your browser.',
          2: 'Location unavailable. Make sure GPS is enabled.',
          3: 'Location request timed out. Try again.',
        };
        setLocErr(msgs[err.code] || 'Could not get location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (error) {
    return (
      <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', background:'#fef2f2', borderRadius:12, border:'1px solid #fecaca', flexDirection:'column', gap:8 }}>
        <AlertTriangle size={24} color="#dc2626"/>
        <p style={{ fontSize:13, color:'#dc2626', textAlign:'center', maxWidth:300 }}>{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0', flexDirection:'column', gap:10 }}>
        <Loader size={24} color="#3b82f6" style={{ animation:'spin 1s linear infinite' }}/>
        <p style={{ fontSize:13, color:'#64748b' }}>Loading map...</p>
      </div>
    );
  }

  return (
    <div style={{ position:'relative', borderRadius:12, overflow:'hidden', border:'1px solid #e2e8f0' }}>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div ref={mapRef} style={{ height, width:'100%' }}/>

      {/* Locate Me button — top right above zoom controls */}
      <div style={{ position:'absolute', top:10, right:10, zIndex:1000 }}>
        <button
          onClick={locateMe}
          disabled={locating}
          title="Show my location"
          style={{
            width:34, height:34, borderRadius:6, background:'#fff',
            border:'1px solid #e2e8f0', cursor:'pointer', display:'flex',
            alignItems:'center', justifyContent:'center',
            boxShadow:'0 1px 4px rgba(0,0,0,0.15)',
            color: myLoc ? '#2563eb' : '#374151',
            transition:'all .2s',
          }}
        >
          {locating
            ? <Loader size={16} style={{ animation:'spin 1s linear infinite' }}/>
            : <Navigation size={16} fill={myLoc ? '#2563eb' : 'none'} />
          }
        </button>
      </div>

      {/* Error message for location */}
      {locErr && (
        <div style={{ position:'absolute', top:52, right:10, zIndex:1000, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#dc2626', maxWidth:240, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
          {locErr}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position:'absolute', bottom:30, left:10, zIndex:1000,
        background:'rgba(255,255,255,0.96)', borderRadius:8, padding:'8px 12px',
        boxShadow:'0 2px 8px rgba(0,0,0,0.12)', fontSize:11,
        display:'flex', flexDirection:'column', gap:5, maxWidth:160,
      }}>
        {[
          { color:'#1d4ed8', label:'Barangay Hall' },
          { color:'#d97706', label:'MRF Facility' },
          { color:'#059669', label:'Sitio / Zone' },
          ...(points.some(p => p.floodRisk) ? [{ color:'#dc2626', label:'Flood Risk Area' }] : []),
          ...(myLoc ? [{ color:'#2563eb', label:'Your Location', dot:true }] : []),
          ...(showRoute ? [{ color:'#3b82f6', label:'Collection Route', dashed:true }] : []),
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            {l.dashed
              ? <div style={{ width:16, height:3, background:l.color, borderTop:`2px dashed ${l.color}`, flexShrink:0 }}/>
              : l.dot
              ? <div style={{ width:10, height:10, borderRadius:'50%', background:l.color, border:`2px solid ${l.color}40`, flexShrink:0 }}/>
              : <div style={{ width:10, height:10, borderRadius:'50%', background:l.color, flexShrink:0 }}/>
            }
            <span style={{ color:'#374151', fontWeight:500 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}