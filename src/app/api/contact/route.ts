import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { push, ref, serverTimestamp } from 'firebase/database';

// Helper function to initialize Firebase Admin SDK
const ensureAdminInitialized = () => {
  if (!admin.apps.length) {
    // When running on App Hosting, the config is automatically provided.
    admin.initializeApp({
      databaseURL: process.env.DATABASE_URL,
    });
  }
};

export async function POST(req: NextRequest) {
  try {
    ensureAdminInitialized();
    const db = admin.database();

    const { name, email, subject, message } = await req.json();

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Semua field harus diisi.' }, { status: 400 });
    }

    const messagesRef = ref(db, 'contactMessages');
    
    // Push new message data
    await push(messagesRef, {
      name,
      email,
      subject,
      message,
      createdAt: serverTimestamp(),
      read: false, // To track if you've read the message
    });

    return NextResponse.json({ success: true, message: 'Pesan berhasil disimpan.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error saving contact message:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan di server.' }, { status: 500 });
  }
}
