import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingCaptions } from '@/ai/flows/generate-marketing-captions';
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';
import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';

const creditsToDeduct = 2;

export async function POST(req: NextRequest) {
  try {
    // Inisialisasi Firebase Admin HARUS ada di dalam blok try ini
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY as string);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.DATABASE_URL
      });
    }
    const db = getDatabase();
    const auth = admin.auth();

    // --- Sisa logika Anda ---
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userCreditsRef = db.ref(`users/${uid}/credits`);
    const snapshot = await userCreditsRef.once('value');
    const currentCredits = snapshot.val();

    if (currentCredits < creditsToDeduct) {
      return NextResponse.json({ error: 'Kredit tidak cukup.' }, { status: 402 });
    }

    const body = await req.json();
    const { productImage, productDescription } = body;

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Missing product image or description' }, { status: 400 });
    }
    
    const [captionResult, flyerResult] = await Promise.all([
      generateMarketingCaptions({ productImage, productDescription }),
      generateProductFlyer({ productImage, productDescription }),
    ]);

    await userCreditsRef.transaction((currentValue) => (currentValue && currentValue >= creditsToDeduct) ? currentValue - creditsToDeduct : undefined);

    return NextResponse.json({
      flyerImageUri: flyerResult.flyerImageUri,
      captions: captionResult.captions,
    });

  } catch (error: any) {
    console.error('!!! CRITICAL API Route Error:', error); 
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Gagal memproses permintaan di server.', details: errorMessage }, { status: 500 });
  }
}