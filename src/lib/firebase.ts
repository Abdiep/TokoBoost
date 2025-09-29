import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  "projectId": "studio-5403298991-e6700",
  "appId": "1:20419637746:web:23853c2d489ff30647bb6b",
  "apiKey": "AIzaSyDxPHI8du4GsBN89G4AePGeGJOpKpGL--g",
  "authDomain": "studio-5403298991-e6700.firebaseapp.com",
  "databaseURL": "https://studio-5403298991-e6700-default-rtdb.firebaseio.com",
  "measurementId": "",
  "messagingSenderId": "20419637746"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
