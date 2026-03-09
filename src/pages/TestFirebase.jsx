// src/pages/TestFirebase.jsx
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function TestFirebase() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Test 1: Create Test User
  const testCreateUser = async () => {
    setLoading(true);
    setStatus('Creating test user...');
    
    try {
      const email = 'test@ebarangay.com';
      const password = 'test123456';
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setStatus(`✅ SUCCESS! User created: ${userCredential.user.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setStatus('ℹ️ User already exists! Try "Test Login" instead.');
      } else {
        setStatus(`❌ ERROR: ${error.message}`);
      }
    }
    
    setLoading(false);
  };

  // Test 2: Login Test User
  const testLogin = async () => {
    setLoading(true);
    setStatus('Logging in...');
    
    try {
      const email = 'test@ebarangay.com';
      const password = 'test123456';
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setStatus(`✅ SUCCESS! Logged in as: ${userCredential.user.email}`);
    } catch (error) {
      setStatus(`❌ ERROR: ${error.message}`);
    }
    
    setLoading(false);
  };

  // Test 3: Write to Firestore
  const testFirestoreWrite = async () => {
    setLoading(true);
    setStatus('Writing to Firestore...');
    
    try {
      if (!auth.currentUser) {
        setStatus('❌ ERROR: Please login first!');
        setLoading(false);
        return;
      }

      const docRef = await addDoc(collection(db, 'test_collection'), {
        message: 'Hello from E-Barangay!',
        timestamp: new Date().toISOString(),
        userId: auth.currentUser.uid
      });
      
      setStatus(`✅ SUCCESS! Document created with ID: ${docRef.id}`);
    } catch (error) {
      setStatus(`❌ ERROR: ${error.message}`);
    }
    
    setLoading(false);
  };

  // Test 4: Read from Firestore
  const testFirestoreRead = async () => {
    setLoading(true);
    setStatus('Reading from Firestore...');
    
    try {
      const querySnapshot = await getDocs(collection(db, 'test_collection'));
      const count = querySnapshot.size;
      
      if (count > 0) {
        setStatus(`✅ SUCCESS! Found ${count} documents in test_collection`);
      } else {
        setStatus('ℹ️ Collection is empty. Try "Write to Firestore" first.');
      }
    } catch (error) {
      setStatus(`❌ ERROR: ${error.message}`);
    }
    
    setLoading(false);
  };

  // Run All Tests
  const runAllTests = async () => {
    setStatus('🚀 Running all tests...\n');
    setLoading(true);

    // Test 1
    setStatus(prev => prev + '\n1️⃣ Testing Authentication...');
    try {
      await testLogin();
    } catch (error) {
      await testCreateUser();
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2
    setStatus(prev => prev + '\n2️⃣ Testing Firestore Write...');
    await testFirestoreWrite();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3
    setStatus(prev => prev + '\n3️⃣ Testing Firestore Read...');
    await testFirestoreRead();

    setStatus(prev => prev + '\n\n✅ All tests completed!');
    setLoading(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔥 Firebase Connection Test
          </h1>
          <p className="text-gray-600">
            Test your Firebase setup before building the app
          </p>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={testCreateUser}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              1. Create Test User
            </button>

            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              2. Test Login
            </button>

            <button
              onClick={testFirestoreWrite}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              3. Write to Firestore
            </button>

            <button
              onClick={testFirestoreRead}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              4. Read from Firestore
            </button>
          </div>

          <button
            onClick={runAllTests}
            disabled={loading}
            className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-bold transition-colors disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
          >
            🚀 RUN ALL TESTS
          </button>
        </div>

        {/* Status Display */}
        <div className="bg-gray-900 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-green-400 min-h-50 whitespace-pre-wrap">
            {loading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                <span>Testing...</span>
              </div>
            )}
            {status || 'Click a test button to start...'}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">📋 Instructions</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-2">
            <li>Click "RUN ALL TESTS" to test everything at once</li>
            <li>Or click individual test buttons to test one by one</li>
            <li>If you see ✅ SUCCESS messages, Firebase is working!</li>
            <li>If you see ❌ ERROR messages, check your Firebase config</li>
          </ol>
        </div>

        {/* Test Credentials */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-4">
          <h3 className="text-lg font-bold text-yellow-900 mb-2">🔑 Test Credentials</h3>
          <p className="text-yellow-800 mb-2">These tests will create and use:</p>
          <code className="block bg-yellow-100 p-3 rounded text-sm">
            Email: test@ebarangay.com<br />
            Password: test123456
          </code>
        </div>
      </div>
    </div>
  );
}