'use server';

import {NextRequest, NextResponse} from 'next/server';
import {generateMarketingCaptions} from '@/ai/flows/generate-marketing-captions';
import {generateProductFlyer} from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';

// --- Inisialisasi Firebase Admin SDK ---
// Pastikan ini hanya berjalan sekali
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://studio-5403298991-e6700-default-rtdb.firebaseio.com",
    });
    console.log('Firebase Admin SDK initialized.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error.stack);
  }
}

const auth = admin.auth();
const db = admin.database();
// -----------------------------------------

const creditsToDeduct = 2;

export async function POST(req: NextRequest) {
  // Validasi Dini: Pastikan Admin SDK siap
  if (!db || !auth) {
    console.error("API call failed: Firebase Admin SDK is not properly initialized.");
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan.' }, { status: 401 });
  }
  const idToken = authorization.split('Bearer ')[1];
  
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error: any) {
     console.error('Token verification failed:', error);
     let clientErrorMessage = "Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.";
     return NextResponse.json({ error: clientErrorMessage }, { status: 401 });
  }
  
  const uid = decodedToken.uid;
  const userRef = db.ref(`users/${uid}`);

  try {
    const { productImage, productDescription } = await req.json();

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Data produk tidak lengkap.' }, { status: 400 });
    }

    // 1. Periksa kredit pengguna SEBELUM melakukan operasi AI
    const snapshot = await userRef.child('credits').get();
    const currentCredits = snapshot.val();
    if (currentCredits === null || currentCredits < creditsToDeduct) {
        return NextResponse.json({ error: 'Kredit tidak cukup untuk melakukan operasi ini.' }, { status: 402 }); // 402 Payment Required
    }

    // 2. Jalankan proses AI secara paralel
    const [captionResult, flyerResult] = await Promise.all([
      generateMarketingCaptions({ productImage, productDescription }),
      generateProductFlyer({ productImage, productDescription }),
    ]);

    // 3. JIKA AI berhasil, potong kredit menggunakan transaksi
    const newCredits = await new Promise<number>((resolve, reject) => {
      userRef.child('credits').transaction(
        (credits) => {
          if (credits === null || credits < creditsToDeduct) {
            // Harusnya tidak pernah terjadi karena sudah dicek, tapi sebagai pengaman
            return; // Abort transaction
          }
          return credits - creditsToDeduct;
        },
        (error, committed, snapshot) => {
          if (error) {
            return reject(new Error('Gagal memperbarui kredit.'));
          }
          if (!committed) {
            return reject(new Error('Kredit tidak cukup saat transaksi.'));
          }
          resolve(snapshot.val());
        }
      );
    });

    // 4. Kembalikan hasil ke pengguna
    return NextResponse.json({
      flyerImageUri: flyerResult.flyerImageUri,
      captions: captionResult.captions,
      newCredits,
    });

  } catch (error: any) {
    // Tangani semua jenis error (AI, transaksi, dll)
    console.error('🚨 API Error in /api/generate:', error);
    // Kirim pesan error yang lebih umum ke klien, karena kredit tidak dipotong.
    return NextResponse.json({ error: 'Gagal memproses permintaan AI. Kredit Anda tidak dipotong. Silakan coba lagi.' }, { status: 500 });
  }
}
