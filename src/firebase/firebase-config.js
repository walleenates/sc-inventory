// src/firebase/firebase-config.js

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore
import { getStorage } from 'firebase/storage'; // Import Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCFAoDDI-0Et2yRYQbHWIH9tBK4mfz9q-Q",
  authDomain: "cap2point1.firebaseapp.com",
  projectId: "cap2point1",
  storageBucket: "cap2point1.appspot.com",
  messagingSenderId: "732557883166",
  appId: "1:732557883166:web:010e69eec14ffe23e3bb0f",
  measurementId: "G-PCYJR8KDWP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Storage

// Initialize Google and Facebook Auth Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Export the auth, db, storage, and providers
export { auth, db, storage, googleProvider, facebookProvider };
