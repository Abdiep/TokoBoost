import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsAndConditionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Syarat dan Ketentuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Terakhir diperbarui:</strong> {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>
              Dengan mengakses atau menggunakan layanan BrosurAI, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini.
            </p>

            <h2 className="font-headline text-2xl pt-4">1. Penggunaan Layanan</h2>
            <p>
              Anda setuju untuk menggunakan layanan kami hanya untuk tujuan yang sah. Anda bertanggung jawab penuh atas konten (gambar dan teks) yang Anda unggah. Anda tidak boleh mengunggah konten yang melanggar hukum, hak cipta, atau bersifat cabul.
            </p>

            <h2 className="font-headline text-2xl pt-4">2. Akun dan Kredit</h2>
            <p>
              Anda harus membuat akun untuk menggunakan layanan kami. Kredit yang dibeli tidak dapat diuangkan kembali dan hanya dapat digunakan untuk layanan di platform BrosurAI.
            </p>

            <h2 className="font-headline text-2xl pt-4">3. Hak Kekayaan Intelektual</h2>
            <p>
              Anda memiliki hak penuh atas konten asli yang Anda unggah. Anda juga memiliki hak atas hasil akhir (flyer dan caption) yang dihasilkan oleh layanan kami dari input Anda. Kami tidak mengklaim kepemilikan atas konten Anda.
            </p>

            <h2 className="font-headline text-2xl pt-4">4. Batasan Tanggung Jawab</h2>
            <p>
              Layanan disediakan "sebagaimana adanya". Kami tidak bertanggung jawab atas segala kerusakan atau kerugian yang timbul dari penggunaan layanan kami.
            </p>

             <h2 className="font-headline text-2xl pt-4">5. Perubahan Layanan</h2>
            <p>
              Kami berhak untuk mengubah atau menghentikan layanan kapan saja tanpa pemberitahuan sebelumnya.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
