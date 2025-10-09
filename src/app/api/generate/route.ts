
'use server';

import {NextRequest, NextResponse} from 'next/server';
import {generateMarketingCaptions} from '@/ai/flows/generate-marketing-captions';
import {generateProductFlyer} from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const creditsToDeduct = 2;

// Initialize Firebase Admin SDK
// This should only be done once.
if (!admin.apps.length) {
  try {
    // Construct the full path to the service account key
    const keyPath = path.join(process.cwd(), 'src', 'serviceAccountKey.json');

    // Check if the file exists before trying to read it
    if (!fs.existsSync(keyPath)) {
      throw new Error("serviceAccountKey.json not found at path: " + keyPath);
    }
    
    const keyFile = fs.readFileSync(keyPath, 'utf8');
    const serviceAccount = JSON.parse(keyFile);

    // Check if the service account key is still a placeholder
    if (!serviceAccount.project_id || serviceAccount.project_id === 'PASTE_YOUR_PROJECT_ID_HERE') {
       console.warn("Firebase Admin SDK not initialized: Service account key is a placeholder.");
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      });
      console.log('Firebase Admin SDK initialized successfully.');
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error);
  }
}

export async function POST(req: NextRequest) {
  if (!admin.apps.length) {
    console.error("API call failed: Firebase Admin SDK is not initialized.");
    return NextResponse.json({ error: 'Kesalahan konfigurasi server internal: Kredensial server tidak valid.' }, { status: 500 });
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
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    console.log("Authorization Header received, attempting to verify token...");
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log("Decoded Token UID:", decodedToken.uid);
    const uid = decodedToken.uid;

    const userRef = db.ref(`users/${uid}`);
    
    // Wrap the transaction in a Promise
    const newCredits = await new Promise<number>((resolve, reject) => {
      userRef.child('credits').transaction(
        (currentCredits) => {
          if (currentCredits === null || currentCredits < creditsToDeduct) {
            // Abort transaction if credits are insufficient or null
            return; 
          }
          return currentCredits - creditsToDeduct;
        },
        (error, committed, snapshot) => {
          if (error) {
            console.error('Transaction failed: ', error);
            return reject(new Error('Gagal memperbarui kredit.'));
          }
          if (!committed) {
             console.error('Transaction not committed. Insufficient credits or data race.');
            return reject(new Error('Kredit tidak cukup.'));
          }
          // Resolve the promise with the new credit value
          resolve(snapshot.val());
        }
      );
    });

    const { productImage, productDescription } = body;
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
    return NextResponse.json({ error: error.message || 'Gagal memproses permintaan di server.' }, { status: 500 });
  }
}
