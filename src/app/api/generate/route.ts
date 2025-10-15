'use server';

import {NextRequest, NextResponse} from 'next/server';
import {generateMarketingCaptions} from '@/ai/flows/generate-marketing-captions';
import {generateProductFlyer} from '@/ai/flows/generate-product-flyer';

// API Route ini sekarang HANYA bertanggung jawab untuk memanggil AI.
// Otentikasi dan manajemen kredit ditangani sepenuhnya di client-side.

export async function POST(req: NextRequest) {
  try {
    const { productImage, productDescription } = await req.json();

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Data produk tidak lengkap.' }, { status: 400 });
    }
    
    // 1. Jalankan proses AI secara paralel dengan allSettled agar lebih tangguh
    const results = await Promise.allSettled([
      generateMarketingCaptions({ productImage, productDescription }),
      generateProductFlyer({ productImage, productDescription }),
    ]);

    const captionResult = results[0];
    const flyerResult = results[1];

    // 2. Siapkan data respons, tangani kegagalan parsial
    const responseData = {
      captions: captionResult.status === 'fulfilled' ? captionResult.value.captions : [],
      flyerImageUri: flyerResult.status === 'fulfilled' ? flyerResult.value.flyerImageUri : null,
    };
    
    // Log error jika ada kegagalan, tapi jangan membuat request gagal total
    if (captionResult.status === 'rejected') {
        console.error('🚨 AI Caption Generation Error:', captionResult.reason);
    }
    if (flyerResult.status === 'rejected') {
        console.error('🚨 AI Flyer Generation Error:', flyerResult.reason);
    }

    // 3. Kembalikan hasil ke pengguna
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('🚨 Unhandled Error in /api/generate:', error);
    return NextResponse.json({ error: 'Gagal memproses permintaan AI. Silakan coba lagi.' }, { status: 500 });
  }
}
