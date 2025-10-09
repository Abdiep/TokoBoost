'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingCaptions } from '@/ai/flows/generate-marketing-captions';
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import { serviceAccount } from '@/lib/service-account';

const creditsToDeduct = 2;

// Inisialisasi Firebase Admin di luar handler permintaan.
// Ini memastikan inisialisasi hanya terjadi sekali saat server dimulai, bukan di setiap panggilan API.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.DATABASE_URL
    });
  } catch (error: any) {
    console.error("!!! CRITICAL Firebase Admin Init Error:", error.message);
  }
}

export async function POST(req: NextRequest) {
  // Pengecekan tambahan jika inisialisasi awal gagal.
  if (!admin.apps.length) {
    console.error('Firebase Admin SDK not initialized.');
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

  try {
    const db = getDatabase();
    const auth = admin.auth();

    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userCreditsRef = db.ref(`users/${uid}/credits`);
    const snapshot = await userCreditsRef.once('value');
    const currentCredits = snapshot.val();

    if (currentCredits === null || currentCredits < creditsToDeduct) {
      return NextResponse.json({ error: 'Kredit tidak cukup.' }, { status: 402 });
    }

    const body = await req.json();
    const { productImage, productDescription } = body;

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Gambar atau deskripsi produk tidak boleh kosong.' }, { status: 400 });
    }
    
    // Kurangi kredit menggunakan transaksi untuk keamanan
    const transactionResult = await userCreditsRef.transaction((currentValue) => {
        if (currentValue !== null && currentValue >= creditsToDeduct) {
            return currentValue - creditsToDeduct;
        }
        return; // Batalkan transaksi jika kredit tidak cukup
    });

    if (!transactionResult.committed) {
         return NextResponse.json({ error: 'Kredit tidak cukup untuk melakukan transaksi.' }, { status: 402 });
    }
    
    // Jalankan generasi AI SETELAH kredit berhasil dikurangi
    const [captionResult, flyerResult] = await Promise.all([
      generateMarketingCaptions({ productImage, productDescription }),
      generateProductFlyer({ productImage, productDescription }),
    ]);

    return NextResponse.json({
      flyerImageUri: flyerResult.flyerImageUri,
      captions: captionResult.captions,
    });

  } catch (error: any) {
    // Memberikan log error yang lebih spesifik
    console.error('!!! CRITICAL API Route Error:', error);
    
    let errorMessage = 'Gagal memproses permintaan di server.';
    let statusCode = 500;

    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
        statusCode = 401;
    } else if (error.code === 'auth/argument-error') {
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
