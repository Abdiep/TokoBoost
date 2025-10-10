import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "monospace-10.firebaseapp.com",
  projectId: "monospace-10",
  storageBucket: "monospace-10.appspot.com",
  messagingSenderId: "5403298991",
  appId: "1:5403298991:web:e6700e47087a177215f700",
  databaseURL: "https://monospace-10-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
