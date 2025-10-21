
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Naikkan batas menjadi 10MB (atau sesuai kebutuhan)
    },
  },
};

import { NextRequest, NextResponse } from 'next/server';
// HANYA import generateProductFlyer
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';

// TODO: Pindahkan logika kredit (sekarang 2 kredit) ke sini untuk keamanan


export async function POST(req: NextRequest) {
  try {
    const { productImage, productDescription } = await req.json();

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Data produk tidak lengkap.' }, { status: 400 });
    }

    // --- PERUBAHAN UTAMA: HANYA memanggil fungsi generate gambar ---
    const flyerResult = await generateProductFlyer({ productImage, productDescription });
    
    // --- (Implementasikan logika Potong 2 Kredit di sini setelah AI berhasil) ---

    // Mengirim kembali respons yang hanya berisi SATU URL gambar
    const responseData = {
      flyerImageUri: flyerResult.flyerImageUri, // (tanpa 's')
    };
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('🚨 Unhandled Error in /api/generate:', error);
    // Mengirim pesan error yang lebih spesifik
    return NextResponse.json({ error: `Gagal memproses permintaan AI: ${error.message}` }, { status: 500 });
  }
}