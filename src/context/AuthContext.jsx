// src/context/AuthContext.jsx - FIXED VERSION
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function with role assignment
  const signup = async (email, password, userData = {}) => {
    try {
      console.log('Starting signup process...');
      
      // Create the auth user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Auth user created:', result.user.uid);
      
      // Prepare user document data
      const userDocData = {
        email: email,
        role: userData.role || 'staff', // Changed default to 'staff' as per your signup code
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        isActive: true,
        assignedModules: userData.assignedModules || [],
        createdAt: serverTimestamp(), // Using serverTimestamp for consistency
        updatedAt: serverTimestamp()
      };
      
      console.log('Creating user document in Firestore...');
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', result.user.uid), userDocData);
      
      console.log('User document created successfully');
      
      // Important: Sign out after creating the account
      // This prevents the auth state listener from interfering
      await signOut(auth);
      
      return result;
    } catch (error) {
      console.error('Signup error details:', error);
      
      // If user was created but Firestore write failed, clean up
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
          console.log('Cleaned up auth user after Firestore error');
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
      }
      
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful, user ID:', result.user.uid);
      
      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        console.error('User document not found in Firestore');
        await signOut(auth);
        throw new Error('User profile not found. Please contact support.');
      }
      
      const userData = userDoc.data();
      console.log('User data retrieved:', userData);
      
      // Check if user account is active
      if (userData.isActive === false) {
        await signOut(auth);
        throw new Error('Your account has been deactivated. Please contact the administrator.');
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    return signOut(auth);
  };

  // Get user profile from Firestore
  const getUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.warn('User profile not found for UID:', uid);
        
        // If no profile exists, create a default one
        const defaultProfile = {
          email: auth.currentUser?.email || '',
          role: 'staff',
          name: '',
          phone: '',
          address: '',
          isActive: true,
          assignedModules: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', uid), defaultProfile);
        console.log('Created default profile for user:', uid);
        return defaultProfile;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Update user role (only for Chairman)
  const updateUserRole = async (userId, newRole, assignedModules = []) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        role: newRole,
        assignedModules: assignedModules,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Check if current user is Chairman (for role management access)
  const isChairman = () => {
    return currentUser?.profile?.role === 'chairman';
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.uid : 'No user');
      
      if (user) {
        try {
          // Get additional user data from Firestore
          const profile = await getUserProfile(user.uid);
          
          if (profile) {
            setCurrentUser({ 
              ...user, 
              profile,
              uid: user.uid,
              email: user.email
            });
            console.log('User profile loaded successfully');
          } else {
            console.error('Failed to load user profile');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Error in auth state listener:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    getUserProfile,
    updateUserRole,
    isChairman,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};