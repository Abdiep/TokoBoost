
'use server';

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://studio-5403298991-e6700-default-rtdb.firebaseio.com",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { uid, amount } = await req.json();
    if (!uid || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }

    const db = admin.database();
    const userRef = db.ref(`users/${uid}/credits`);

    await userRef.transaction((currentCredits) => (currentCredits || 0) + amount);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error add-credits:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
