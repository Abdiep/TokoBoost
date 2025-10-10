'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  if (!db) {
    console.error("API call failed: Firebase Admin SDK is not initialized.");
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

  try {
    const { uid, amount } = await req.json();
    if (!uid || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }

    const userRef = db.ref(`users/${uid}/credits`);

    await userRef.transaction((currentCredits) => (currentCredits || 0) + amount);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error add-credits:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
