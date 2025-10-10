'use server';

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// --- Inisialisasi Firebase Admin SDK ---
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://studio-5403298991-e6700-default-rtdb.firebaseio.com",
    });
    console.log('Firebase Admin SDK initialized in /api/init-user.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed in /api/init-user:', error.stack);
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
    const { uid, email, name } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
    }

    const userRef = db.ref(`users/${uid}`);

    // Set akan membuat atau menimpa data. Kita gunakan transaksi untuk keamanan.
    await userRef.transaction((currentData) => {
      if (currentData === null) {
        // Hanya buat jika user benar-benar baru
        return {
          email,
          name: name || '',
          credits: 10,
          createdAt: new Date().toISOString(),
        };
      }
      // Jika user sudah ada, batalkan transaksi dengan mengembalikan undefined
      return undefined;
    }, (error, committed) => {
        if (error) {
            throw error;
        }
        if (committed) {
            console.log(`✅ User ${email} berhasil dibuat dengan 10 kredit.`);
        } else {
            console.log(`✅ User ${email} sudah ada, tidak ada data baru yang dibuat.`);
        }
    });

    return NextResponse.json({ success: true, message: 'User initialized or already exists.' });
  } catch (error: any) {
    console.error('❌ Error init-user:', error);
    return NextResponse.json({ error: error.message || 'Gagal menginisialisasi pengguna.' }, { status: 500 });
  }
}
