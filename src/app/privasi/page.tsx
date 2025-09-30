'use client';

import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Kebijakan Privasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Terakhir diperbarui:</strong> {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <h2 className="font-headline text-2xl pt-4">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, seperti saat Anda mendaftar (email) dan membuat konten (gambar dan deskripsi produk). Kami juga menyimpan data penggunaan seperti kredit yang Anda miliki.
            </p>
            
            <h2 className="font-headline text-2xl pt-4">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
            <p>
              Informasi yang kami kumpulkan digunakan untuk menyediakan, memelihara, dan meningkatkan layanan kami. Email Anda digunakan sebagai identifikasi akun, sedangkan data gambar dan teks digunakan untuk memproses permintaan pembuatan konten AI Anda.
            </p>
            
            <h2 className="font-headline text-2xl pt-4">3. Penyimpanan Data</h2>
            <p>
              Data sesi Anda seperti email dan kredit disimpan secara lokal di browser Anda menggunakan LocalStorage untuk menjaga Anda tetap login. Kami tidak menyimpan gambar atau hasil generasi Anda di server kami setelah sesi selesai.
            </p>

            <h2 className="font-headline text-2xl pt-4">4. Keamanan</h2>
            <p>
              Kami mengambil langkah-langkah yang wajar untuk melindungi informasi Anda dari kehilangan, pencurian, penyalahgunaan, dan akses tidak sah.
            </p>
            
            <h2 className="font-headline text-2xl pt-4">5. Perubahan pada Kebijakan Ini</h2>
            <p>
              Kami dapat mengubah Kebijakan Privasi ini dari waktu ke waktu. Jika kami membuat perubahan, kami akan memberitahu Anda dengan merevisi tanggal di bagian atas kebijakan.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
