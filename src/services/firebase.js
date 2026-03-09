// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with YOUR Firebase configuration from Step 4
// Go to Firebase Console → Project Settings → Scroll down to "Your apps"
// Copy the firebaseConfig object and paste it here
const firebaseConfig = {
  apiKey: "AIzaSyDUDr068DM8ZCAA_Q2gdaYLq-y1nXYJlW4",
  authDomain: "e-barangay-74d9a.firebaseapp.com",
  projectId: "e-barangay-74d9a",
  storageBucket: "e-barangay-74d9a.firebasestorage.app",
  messagingSenderId: "230354900072",
  appId: "1:230354900072:web:98e2040bbd7426699197dd",
  measurementId: "G-S93V3GJX35"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;