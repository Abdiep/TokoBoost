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
import { Upload, Wand2, Sparkles, Download, Info, Loader2, FileText, Camera, Image as ImageIcon, AlertTriangle, Copy, Hash } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from './ui/scroll-area';

type GenerationState = 'idle' | 'generating' | 'success' | 'error';
type CaptionResult = {
  caption: string;
  hashtags: string;
};

export default function AppPage() {
  const { isLoggedIn, credits, deductCredits, addCredits } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [productImage, setProductImage] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [generatedCaptions, setGeneratedCaptions] = useState<CaptionResult[]>([]);
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
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: 'Gambar Terlalu Besar',
          description: 'Ukuran gambar tidak boleh melebihi 4MB.',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    if (!productImage || !productDescription) {
      toast({
        title: 'Data Tidak Lengkap',
        description: 'Harap unggah gambar dan isi deskripsi produk.',
        variant: 'destructive',
      });
      return;
    }

    if (credits < 2) {
      toast({
        title: 'Kredit Tidak Cukup',
        description: 'Anda memerlukan 2 kredit untuk membuat konten. Silakan top up.',
        variant: 'destructive',
      });
      return;
    }

    setGenerationState('generating');
    setGeneratedCaptions([]);
    setGeneratedFlyer(null);

    startTransition(async () => {
      const canDeduct = deductCredits(2);
      if (!canDeduct) {
        setGenerationState('error');
        toast({
          title: 'Kredit Tidak Mencukupi',
          description: 'Terjadi masalah saat memotong kredit.',
          variant: 'destructive',
        });
        return;
      }
      
      try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productImage,
                productDescription,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || `API request failed with status ${response.status}`);
        }
        
        const result = await response.json();

        setGeneratedCaptions(result.captions);
        setGeneratedFlyer(result.flyerImageUri);
        
        setGenerationState('success');
        toast({
          title: 'Pembuatan Konten Berhasil!',
          description: 'Caption dan flyer baru Anda telah siap.',
        });
      } catch (error) {
        addCredits(2);
        console.error('AI Generation Error:', error);
        setGenerationState('error');
        toast({
          title: 'Terjadi Kesalahan',
          description: `Gagal membuat konten AI. Kredit Anda telah dikembalikan. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleCopyCaption = (item: CaptionResult) => {
    const textToCopy = `${item.caption}\n\n${item.hashtags}`;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Caption & Hashtag Disalin!',
      description: 'Anda dapat menempelkannya di media sosial.',
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

  const isLoading = generationState === 'generating';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Input Column */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <FileText />
                1. Masukkan Detail Produk
              </CardTitle>
              <CardDescription>Unggah gambar dan tulis deskripsi singkat produk Anda. Proses ini membutuhkan 2 kredit.</CardDescription>
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
              <Button onClick={handleGenerate} disabled={isLoading || !productImage || !productDescription} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isLoading ? 'Membuat Konten...' : 'Buat Konten (2 Kredit)'}
              </Button>
            </CardFooter>
          </Card>

          {/* Output Column */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Sparkles />
                2. Hasil Generasi AI
              </CardTitle>
              <CardDescription>Caption dan flyer yang dihasilkan oleh AI akan muncul di sini.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              {generationState === 'idle' && (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg bg-muted/50 p-8 text-center text-muted-foreground">
                  <Info className="h-12 w-12" />
                  <p>Hasil akan ditampilkan di sini setelah Anda membuat konten.</p>
                </div>
              )}
               {generationState === 'generating' && (
                 <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg bg-muted/50 p-8 text-center text-muted-foreground">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="font-semibold">AI sedang bekerja...</p>
                  <p>Proses ini bisa memakan waktu hingga satu menit.</p>
                </div>
               )}
               {generationState === 'error' && (
                  <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-destructive bg-destructive/10 p-8 text-center text-destructive">
                    <AlertTriangle className="h-12 w-12" />
                    <p className="font-semibold">Gagal Menghasilkan Konten</p>
                    <p className="text-sm">Terjadi kesalahan saat berkomunikasi dengan AI. Kredit Anda telah dikembalikan. Silakan coba lagi.</p>
                    <Button variant="destructive" onClick={handleGenerate}>Coba Lagi</Button>
                  </div>
               )}
               {generationState === 'success' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    {/* Flyer Result */}
                    <div className="space-y-3">
                       <h3 className="font-headline text-lg">Flyer Produk</h3>
                       <div className="aspect-square w-full rounded-lg bg-muted/50 relative overflow-hidden">
                        {generatedFlyer ? (
                           <Image src={generatedFlyer} alt="Generated Flyer" fill className="object-cover" />
                        ) : (
                          <div className='flex items-center justify-center h-full text-muted-foreground text-sm'>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang memuat flyer...
                          </div>
                        )}
                       </div>
                    </div>
                     {/* Captions Result */}
                     <div className="space-y-3">
                       <h3 className="font-headline text-lg">Saran Caption & Hashtag</h3>
                       <ScrollArea className="h-80 -mr-4 pr-4">
                         <div className="space-y-4">
                           {generatedCaptions.length > 0 ? (
                            generatedCaptions.map((item, index) => (
                              <div key={index} className="rounded-lg border bg-card p-4 space-y-3 relative pr-12">
                                <p className="text-sm">{item.caption}</p>
                                <p className="text-sm text-muted-foreground">{item.hashtags}</p>
                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => handleCopyCaption(item)}>
                                    <Copy className="h-4 w-4"/>
                                </Button>
                              </div>
                            ))
                           ) : (
                             <div className='text-sm text-muted-foreground'>
                               <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" /> Sedang memuat caption...
                             </div>
                           )}
                         </div>
                       </ScrollArea>
                     </div>
                  </div>
               )}

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetState} disabled={isLoading || generationState !== 'success'}>Buat Lagi</Button>
                <Button onClick={handleDownloadFlyer} disabled={isLoading || !generatedFlyer}>
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
