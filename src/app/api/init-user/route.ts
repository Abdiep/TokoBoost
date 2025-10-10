'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  if (!db) {
    console.error("API call failed: Firebase Admin SDK is not initialized.");
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

  try {
    const { uid, email, name } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
    }

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
