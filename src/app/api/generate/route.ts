
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
    const keyPath = path.join(process.cwd(), 'src', 'serviceAccountKey.json');
    if (!fs.existsSync(keyPath)) {
      throw new Error("serviceAccountKey.json not found at path: " + keyPath);
    }
    
    const keyFile = fs.readFileSync(keyPath, 'utf8');
    const serviceAccount = JSON.parse(keyFile);

    if (!serviceAccount.project_id || serviceAccount.project_id === 'PASTE_YOUR_PROJECT_ID_HERE' || serviceAccount.project_id === "monospace-10") {
       console.warn("Firebase Admin SDK not initialized: Service account key is for the wrong project or is a placeholder.");
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://studio-5403298991-e6700-default-rtdb.firebaseio.com`,
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
    const { productImage, productDescription, uid } = body; // Get UID from body instead of token

    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized: UID tidak ditemukan.' }, { status: 401 });
    }

    // --- TEMPORARILY BYPASSED TOKEN VERIFICATION ---
    // const authorization = req.headers.get('Authorization');
    // if (!authorization?.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Unauthorized: Token tidak ditemukan.' }, { status: 401 });
    // }
    // const idToken = authorization.split('Bearer ')[1];
    // const decodedToken = await auth.verifyIdToken(idToken);
    // const uid = decodedToken.uid;
    // --- END OF BYPASS ---

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
    const clientErrorMessage = error.message.includes('Kredit tidak cukup') 
      ? error.message 
      : 'Gagal memproses permintaan di server.';
    return NextResponse.json({ error: clientErrorMessage }, { status: 500 });
  }
}
