'use server';

import admin from 'firebase-admin';

// This file ensures that the Firebase Admin SDK is initialized only once
// in the entire server-side application lifecycle.

const DATABASE_URL = "https://studio-5403298991-e6700-default-rtdb.firebaseio.com";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: DATABASE_URL,
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error);
    // This is a critical error, but we don't want to crash the entire server.
    // The individual API routes will handle the case where the admin app is not available.
  }
}

const auth = admin.auth();
const db = admin.database();

export { admin, auth, db };
