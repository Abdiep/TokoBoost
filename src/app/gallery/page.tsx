'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAppContext, GeneratedContent } from '@/contexts/AppContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Image as ImageIcon, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function GalleryPage() {
  const { isLoggedIn, history } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  const handleDownloadFlyer = (flyerUrl: string) => {
    const link = document.createElement('a');
    link.href = flyerUrl;
    link.download = `flyer-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <div className="space-y-4 mb-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight">Galeri Konten Anda</h1>
            <p className="text-muted-foreground">
                Lihat semua konten yang pernah Anda buat. Data ini disimpan di browser Anda.
            </p>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border h-96 text-center">
            <GalleryHorizontal className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Galeri Anda Kosong</h2>
            <p className="mt-2 text-muted-foreground">
              Buat konten pertama Anda dan hasilnya akan muncul di sini.
            </p>
            <Button onClick={() => router.push('/')} className="mt-6">
              Buat Konten Baru
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {history.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative aspect-square md:aspect-auto">
                      <Image
                        src={item.generatedFlyer}
                        alt="Generated Flyer"
                        fill
                        className="object-cover"
                      />
                  </div>
                  <div className="flex flex-col">
                    <CardHeader>
                       <CardDescription className="flex items-center gap-2 text-xs">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(item.timestamp), "d MMMM yyyy 'pukul' HH:mm", { locale: id })}
                       </CardDescription>
                      <CardTitle>Flyer Produk</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm flex-grow">
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4"/>Deskripsi Asli</h4>
                            <p className="text-muted-foreground line-clamp-2">{item.productDescription}</p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4"/>Caption Teratas</h4>
                             <p className="text-muted-foreground italic">"{item.generatedCaptions[0]}"</p>
                        </div>
                    </CardContent>
                    <div className="p-6 pt-0">
                        <Button onClick={() => handleDownloadFlyer(item.generatedFlyer)} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Unduh Flyer
                        </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
