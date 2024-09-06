// src/firebase/firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

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
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, googleProvider, facebookProvider };
