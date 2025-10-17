'use server';

import { NextRequest, NextResponse } from 'next/server';
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';

// TODO: Pindahkan logika kredit ke sini untuk keamanan
export async function POST(req: NextRequest) {
  try {
    const { productImage, productDescription } = await req.json();

    if (!productImage || !productDescription) {
      return NextResponse.json({ error: 'Data produk tidak lengkap.' }, { status: 400 });
    }

    // --- PERUBAHAN UTAMA: Menghapus caption, hanya memanggil fungsi generate gambar ---
    const flyerResult = await generateProductFlyer({ productImage, productDescription });
    
    // --- (Implementasikan logika Potong 3 Kredit di sini setelah AI berhasil) ---

    // Mengirim kembali respons yang hanya berisi array gambar
    const responseData = {
      flyerImageUris: flyerResult.flyerImageUris,
    };
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('🚨 Unhandled Error in /api/generate:', error);
    return NextResponse.json({ error: `Gagal memproses permintaan AI: ${error.message}` }, { status: 500 });
  }
}