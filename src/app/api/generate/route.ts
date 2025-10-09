'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingCaptions } from '@/ai/flows/generate-marketing-captions';
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';
import * as serviceAccount from '@/serviceAccountKey.json';

const creditsToDeduct = 2;

// Inisialisasi Firebase Admin SDK secara manual untuk lingkungan non-standar (seperti Cloud Workstations)
// Pastikan serviceAccountKey.json sudah diisi dengan benar.
if (!admin.apps.length) {
  try {
    // Validasi sederhana untuk memastikan service account bukan placeholder
    if (serviceAccount.project_id && serviceAccount.project_id !== "PASTE_YOUR_PROJECT_ID_HERE") {
        const serviceAccountParams = {
            type: serviceAccount.type,
            projectId: serviceAccount.project_id,
            privateKeyId: serviceAccount.private_key_id,
            privateKey: serviceAccount.private_key,
            clientEmail: serviceAccount.client_email,
            clientId: serviceAccount.client_id,
            authUri: serviceAccount.auth_uri,
            tokenUri: serviceAccount.token_uri,
            authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
            clientC509CertUrl: serviceAccount.client_x509_cert_url,
        } as admin.ServiceAccount;

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountParams),
          databaseURL: process.env.DATABASE_URL,
        });
        console.log("Firebase Admin SDK initialized successfully using service account file.");
    } else {
        console.warn("Firebase Admin SDK not initialized: serviceAccountKey.json contains placeholder data.");
    }
  } catch (error) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed", error);
  }
}

export async function POST(req: NextRequest) {
  if (!admin.apps.length) {
    console.error('Firebase Admin SDK not initialized. Check server startup logs and serviceAccountKey.json.');
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal: Kredensial server tidak valid.' }, { status: 500 });
  }

  const db = admin.database();
  const auth = admin.auth();

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Body JSON tidak valid atau kosong.' }, { status: 400 });
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    console.log("Authorization Header received, attempting to verify token...");
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("Decoded Token UID:", decodedToken.uid);
    const uid = decodedToken.uid;

    const userCreditsRef = db.ref(`users/${uid}/credits`);
    
    const newCredits = await new Promise<number>((resolve, reject) => {
      userCreditsRef.transaction((currentCredits) => {
        if (currentCredits === null || currentCredits < creditsToDeduct) {
          return undefined; 
        }
        return currentCredits - creditsToDeduct;
      }, (error, committed, snapshot) => {
        if (error) {
          return reject(new Error('Transaksi database gagal.'));
        }
        if (!committed) {
          return reject(new Error('Kredit tidak cukup untuk melakukan transaksi.'));
        }
        resolve(snapshot.val());
      });
    });

    const { productImage, productDescription } = body;

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Gambar atau deskripsi produk tidak boleh kosong.' }, { status: 400 });
    }
    
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
    } else if (error.code === 'auth/argument-error' || error.code === 'auth/id-token-revoked' || error.code?.startsWith('auth/')) {
        errorMessage = 'Token tidak valid atau sesi bermasalah. Silakan login kembali.';
        statusCode = 401;
    } else if (error.message.includes('Kredit tidak cukup')) {
        errorMessage = error.message;
        statusCode = 402;
    }

    const errorDetails = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage, details: errorDetails }, { status: statusCode });
  }
}
