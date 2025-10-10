'use server';

import {NextRequest, NextResponse} from 'next/server';
import {generateMarketingCaptions} from '@/ai/flows/generate-marketing-captions';
import {generateProductFlyer} from '@/ai/flows/generate-product-flyer';
import { auth, db } from '@/lib/firebase-admin';

const creditsToDeduct = 2;

export async function POST(req: NextRequest) {
  if (!auth || !db) {
    console.error("API call failed: Firebase Admin SDK is not initialized.");
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal.' }, { status: 500 });
  }

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
    let clientErrorMessage = 'Gagal memproses permintaan di server.';
    let status = 500;
    
    if (error.code === 'auth/id-token-expired' || error.message.includes('incorrect "aud" claim')) {
        clientErrorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
        status = 401;
    } else if (error.message.includes('Kredit tidak cukup')) {
        clientErrorMessage = error.message;
        status = 402; // Payment Required
    } else if (error.code?.startsWith('auth/')) {
        clientErrorMessage = 'Terjadi masalah otentikasi. Silakan login kembali.';
        status = 401;
    }

    return NextResponse.json({ error: clientErrorMessage }, { status });
  }
}
