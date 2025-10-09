'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingCaptions } from '@/ai/flows/generate-marketing-captions';
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';

const creditsToDeduct = 2;

// Initialize Firebase Admin SDK only if it's not already initialized.
// This is done at the module level to ensure it only runs once per server instance.
// In Firebase App Hosting, initializeApp() without arguments automatically
// uses the project's service account credentials from the environment.
if (!admin.apps.length) {
  admin.initializeApp();
  console.log("Firebase Admin SDK initialized successfully using environment credentials.");
}

export async function POST(req: NextRequest) {
  // Now, we can be sure that the SDK is initialized when this function is called.
  // The check below becomes a safeguard for unusual edge cases.
  if (!admin.apps.length) {
    console.error('Firebase Admin SDK not initialized. Check server startup logs.');
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

    const userRef = db.ref(`users/${uid}`);
    
    // Kurangi kredit menggunakan transaksi untuk keamanan
    const transactionResult = await userRef.child('credits').transaction((currentCredits) => {
        if (currentCredits === null || currentCredits < creditsToDeduct) {
            return; // Abort transaction
        }
        return currentCredits - creditsToDeduct;
    });

    if (!transactionResult.committed) {
        throw new Error('Kredit tidak cukup untuk melakukan transaksi.');
    }
    
    const newCredits = transactionResult.snapshot.val();

    // Jika transaksi berhasil, lanjutkan dengan AI
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
