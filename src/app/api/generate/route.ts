'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingCaptions } from '@/ai/flows/generate-marketing-captions';
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';

const creditsToDeduct = 2;

// Inisialisasi Firebase Admin SDK hanya sekali di level modul.
// Di Firebase App Hosting, `initializeApp()` tanpa argumen akan otomatis
// menggunakan kredensial dari environment.
if (!admin.apps.length) {
  admin.initializeApp();
  console.log("Firebase Admin SDK initialized successfully using environment credentials.");
}

export async function POST(req: NextRequest) {
  // Pastikan SDK sudah terinisialisasi
  if (!admin.apps.length) {
    console.error('Firebase Admin SDK not initialized. Check server startup logs.');
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

  try {
    // Gunakan Admin SDK untuk semua layanan Firebase di backend
    const db = admin.database();
    const auth = admin.auth();

    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userCreditsRef = db.ref(`users/${uid}/credits`);
    
    // --- PERBAIKAN KRITIS PADA LOGIKA TRANSAKSI ---
    // Fungsi transaction di Admin SDK menggunakan callback, bukan promise langsung.
    // Kita bungkus dalam Promise agar bisa di-await dengan benar.
    const newCredits = await new Promise<number>((resolve, reject) => {
      userCreditsRef.transaction((currentCredits) => {
        if (currentCredits === null || currentCredits < creditsToDeduct) {
          // Abort transaction, user doesn't have enough credits.
          // Reject the promise to trigger the catch block.
          return undefined; 
        }
        return currentCredits - creditsToDeduct;
      }, (error, committed, snapshot) => {
        if (error) {
          return reject(new Error('Transaksi database gagal.'));
        }
        if (!committed) {
          // This case handles when the transaction is aborted (e.g., not enough credits)
          return reject(new Error('Kredit tidak cukup untuk melakukan transaksi.'));
        }
        // If committed, resolve the promise with the new credit value.
        resolve(snapshot.val());
      });
    });

    // Jika promise di-reject (error atau kredit tidak cukup), kode di bawah ini tidak akan berjalan.
    
    const body = await req.json();
    const { productImage, productDescription } = body;

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Gambar atau deskripsi produk tidak boleh kosong.' }, { status: 400 });
    }
    
    // Jalankan generasi AI SETELAH kredit berhasil dikurangi
    const [captionResult, flyerResult] = await Promise.all([
      generateMarketingCaptions({ productImage, productDescription }),
      generateProductFlyer({ productImage, productDescription }),
    ]);

    return NextResponse.json({
      flyerImageUri: flyerResult.flyerImageUri,
      captions: captionResult.captions,
      newCredits: newCredits
    });

  } catch (error: any) {
    console.error('!!! CRITICAL API Route Error:', error);
    
    let errorMessage = 'Gagal memproses permintaan di server.';
    let statusCode = 500;

    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
        statusCode = 401;
    } else if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked') {
        errorMessage = 'Token tidak valid. Silakan login kembali.';
        statusCode = 401;
    } else if (error.message.includes('Kredit tidak cukup')) {
        errorMessage = error.message;
        statusCode = 402;
    }

    const errorDetails = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: statusCode });
  }
}
