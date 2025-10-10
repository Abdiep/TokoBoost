'use server';

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// --- Inisialisasi Firebase Admin SDK ---
// Pastikan ini hanya berjalan sekali
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://studio-5403298991-e6700-default-rtdb.firebaseio.com",
    });
    console.log('Firebase Admin SDK initialized in /api/add-credits.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed in /api/add-credits:', error.stack);
  }
}

const db = admin.database();
// -----------------------------------------


export async function POST(req: NextRequest) {
  if (!db) {
    console.error("API call failed: Firebase Admin SDK is not properly initialized.");
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

  try {
    const { uid, amount } = await req.json();
    if (!uid || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }

    const userRef = db.ref(`users/${uid}/credits`);

    // Gunakan transaksi untuk penambahan kredit yang aman
    const { snapshot } = await userRef.transaction((currentCredits) => {
        // Jika user belum ada (misal, dari pembayaran pertama), mulai dari 0
        return (currentCredits || 0) + amount;
    });

    return NextResponse.json({ success: true, newCredits: snapshot.val() });
  } catch (error: any) {
    console.error('❌ Error add-credits:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan kredit.' }, { status: 500 });
  }
}
