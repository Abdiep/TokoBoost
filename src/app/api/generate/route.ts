'use server';

import {NextRequest, NextResponse} from 'next/server';
import {generateMarketingCaptions} from '@/ai/flows/generate-marketing-captions';
import {generateProductFlyer} from '@/ai/flows/generate-product-flyer';

// API Route ini sekarang HANYA bertanggung jawab untuk memanggil AI.
// Otentikasi dan manajemen kredit ditangani sepenuhnya di client-side.

export const config = {
  maxDuration: 300,
};

export async function POST(req: NextRequest) {
  try {
    const { productImage, productDescription } = await req.json();

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Data produk tidak lengkap.' }, { status: 400 });
    }
    
    // 1. Jalankan proses AI secara paralel
    const [captionResult, flyerResult] = await Promise.all([
      generateMarketingCaptions({ productImage, productDescription }),
      generateProductFlyer({ productImage, productDescription }),
    ]);

    // 2. Kembalikan hasil ke pengguna
    return NextResponse.json({
      flyerImageUri: flyerResult.flyerImageUri,
      captions: captionResult.captions,
    });

  } catch (error: any) {
    console.error('🚨 AI Generation Error in /api/generate:', error);
    return NextResponse.json({ error: 'Gagal memproses permintaan AI. Silakan coba lagi.' }, { status: 500 });
  }
}
