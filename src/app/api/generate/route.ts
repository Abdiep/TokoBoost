
'use server';

import {NextRequest, NextResponse} from 'next/server';
import {generateMarketingCaptions} from '@/ai/flows/generate-marketing-captions';
import {generateProductFlyer} from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';

const creditsToDeduct = 2;

// Initialize Firebase Admin SDK using Application Default Credentials
// This is the correct and secure way in environments like Firebase App Hosting.
if (!admin.apps.length) {
  try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: `https://studio-5403298991-e6700-default-rtdb.firebaseio.com`,
      });
      console.log('Firebase Admin SDK initialized successfully with ADC.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error);
  }
}

export async function POST(req: NextRequest) {
  if (!admin.apps.length) {
    console.error("API call failed: Firebase Admin SDK is not initialized.");
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

  const auth = admin.auth();
  const db = admin.database();

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Body JSON tidak valid atau kosong.' }, { status: 400 });
  }
  
  try {
    const { productImage, productDescription } = body;

    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userRef = db.ref(`users/${uid}`);
    
    const newCredits = await new Promise<number>((resolve, reject) => {
      userRef.child('credits').transaction(
        (currentCredits) => {
          if (currentCredits === null || currentCredits < creditsToDeduct) {
            return; 
          }
          return currentCredits - creditsToDeduct;
        },
        (error, committed, snapshot) => {
          if (error) {
            return reject(new Error('Gagal memperbarui kredit.'));
          }
          if (!committed) {
            return reject(new Error('Kredit tidak cukup.'));
          }
          resolve(snapshot.val());
        }
      );
    });

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Data produk tidak lengkap.' }, { status: 400 });
    }

    const [captionResult, flyerResult] = await Promise.all([
      generateMarketingCaptions({ productImage, productDescription }),
      generateProductFlyer({ productImage, productDescription }),
    ]);

    return NextResponse.json({
      flyerImageUri: flyerResult.flyerImageUri,
      captions: captionResult.captions,
      newCredits,
    });
  } catch (error: any) {
    console.error('🚨 API Error:', error);
    // Sanitize error message for client
    const clientErrorMessage = error.message.includes('Kredit tidak cukup') || error.message.includes('token')
      ? error.message 
      : 'Gagal memproses permintaan di server.';
    const status = error.message.includes('token') ? 401 : 500;
    return NextResponse.json({ error: clientErrorMessage }, { status });
  }
}
