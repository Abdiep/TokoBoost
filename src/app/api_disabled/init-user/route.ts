'use server';

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin (jika belum)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://monospace-10-default-rtdb.firebaseio.com",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { uid, email, name } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
    }

    const db = admin.database();
    const userRef = db.ref(`users/${uid}`);

    const snapshot = await userRef.get();
    if (!snapshot.exists()) {
      await userRef.set({
        email,
        name: name || '',
        credits: 10,
        createdAt: new Date().toISOString(),
      });
      console.log(`✅ User ${email} berhasil dibuat dengan 10 kredit.`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error init-user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
