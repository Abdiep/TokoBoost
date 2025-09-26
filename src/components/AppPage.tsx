'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Upload, Wand2, Sparkles, Download, Info, Loader2, FileText, Camera, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type GenerationState = 'idle' | 'generating' | 'success' | 'error' | 'disabled';

export default function AppPage() {
  const { isLoggedIn, credits, deductCredits } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [productImage, setProductImage] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [generatedFlyer, setGeneratedFlyer] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
     toast({
       title: 'Fitur Belum Tersedia',
       description: 'Fitur pembuatan konten AI sedang dalam perbaikan. Kami akan segera memperbaikinya.',
       variant: 'destructive',
     });
  };

  const handleDownloadFlyer = () => {
    if (generatedFlyer) {
      const link = document.createElement('a');
      link.href = generatedFlyer;
      link.download = 'flyer-produk.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetState = () => {
    setProductImage(null);
    setProductDescription('');
    setGeneratedCaptions([]);
    setGeneratedFlyer(null);
    setGenerationState('idle');
  };

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fitur AI Sedang Dalam Perbaikan</AlertTitle>
          <AlertDescription>
            Saat ini Anda tidak dapat membuat konten baru. Kami sedang bekerja keras untuk menyelesaikannya. Terima kasih atas kesabaran Anda.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Input Column */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <FileText />
                1. Masukkan Detail Produk
              </CardTitle>
              <CardDescription>Unggah gambar dan tulis deskripsi singkat produk Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product-image">Gambar Produk</Label>
                <div className="relative flex h-64 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-2">
                  <input ref={fileInputRef} id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <input ref={cameraInputRef} id="camera-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                  
                  {productImage ? (
                    <Image src={productImage} alt="Pratinjau Produk" fill className="object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
                       <Upload className="h-10 w-10" />
                       <span className='font-semibold'>Pilih Sumber Gambar</span>
                       <div className="flex w-full gap-3">
                         <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                           <ImageIcon className="mr-2 h-4 w-4" />
                           Galeri
                         </Button>
                         <Button variant="outline" className="w-full" onClick={() => cameraInputRef.current?.click()}>
                           <Camera className="mr-2 h-4 w-4" />
                           Kamera
                         </Button>
                       </div>
                    </div>
                  )}
                </div>
                 {productImage && (
                    <Button variant="link" className="w-full" onClick={() => setProductImage(null)}>Hapus Gambar</Button>
                 )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-description">Deskripsi Produk</Label>
                <Textarea
                  id="product-description"
                  placeholder="Contoh: Sepatu lari ringan dengan teknologi bantalan terbaru, cocok untuk pemula maupun profesional."
                  rows={5}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} disabled={true} className="w-full">
                <Wand2 className="mr-2 h-4 w-4" />
                Buat Konten (Fitur Dinonaktifkan)
              </Button>
            </CardFooter>
          </Card>

          {/* Output Column */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Sparkles />
                2. Hasil Generasi AI
              </CardTitle>
              <CardDescription>Caption dan flyer yang dihasilkan oleh AI akan muncul di sini.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg bg-muted/50 p-8 text-center text-muted-foreground">
                <Info className="h-12 w-12" />
                <p>Hasil akan ditampilkan di sini setelah Anda membuat konten.</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetState} disabled={true}>Buat Lagi</Button>
                <Button onClick={handleDownloadFlyer} disabled={true}>
                  <Download className="mr-2 h-4 w-4" />
                  Unduh Flyer
                </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
