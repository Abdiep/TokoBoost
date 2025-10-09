'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingCaptions } from '@/ai/flows/generate-marketing-captions';
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
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
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("!!! CRITICAL Firebase Admin Init Error:", error.message);
    // Kesalahan ini fatal, jangan lanjutkan.
  }
}

export async function POST(req: NextRequest) {
  // Pengecekan tambahan jika inisialisasi awal gagal.
  if (!admin.apps.length) {
    console.error('Firebase Admin SDK not initialized. Check service-account.ts and server logs.');
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

  try {
    const db = getFirestore();
    const auth = admin.auth();

    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDocRef = db.collection('users').doc(uid);
    
    // Kurangi kredit menggunakan transaksi untuk keamanan
    const transactionResult = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists) {
            // Seharusnya tidak terjadi jika pengguna sudah login, tapi sebagai pengaman
            throw new Error("User document does not exist.");
        }
        
        const currentCredits = userDoc.data()?.credits ?? 0;
        
        if (currentCredits < creditsToDeduct) {
            // Lempar error untuk membatalkan transaksi
            throw new Error('Kredit tidak cukup untuk melakukan transaksi.');
        }

        const newCredits = currentCredits - creditsToDeduct;
        transaction.update(userDocRef, { credits: newCredits });
        return newCredits;
    });


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
      newCredits: transactionResult // Mengembalikan sisa kredit untuk pembaruan UI jika perlu
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
    } else if (error.message.includes("User document does not exist")) {
        errorMessage = "Data pengguna tidak ditemukan di database.";
        statusCode = 404;
    }

    const errorDetails = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: statusCode });
  }
}
