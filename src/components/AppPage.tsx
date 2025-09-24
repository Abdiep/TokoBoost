'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/contexts/AppContext';
import { generateMarketingCaptions } from '@/ai/flows/generate-marketing-captions';
import { generateProductFlyer } from '@/ai/flows/generate-product-flyer';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Upload, Wand2, Sparkles, Download, Info, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

type GenerationState = 'idle' | 'generating' | 'success' | 'error';

export default function AppPage() {
  const { isLoggedIn, credits, deductCredits, addHistory } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [productImage, setProductImage] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [generatedFlyer, setGeneratedFlyer] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!productImage || !productDescription) {
      toast({ title: 'Input Tidak Lengkap', description: 'Mohon unggah gambar dan isi deskripsi produk.', variant: 'destructive' });
      return;
    }
    if (credits < 2) {
      toast({ title: 'Kredit Tidak Cukup', description: 'Anda memerlukan 2 kredit untuk membuat konten. Silakan isi ulang.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      setGenerationState('generating');
      setGeneratedCaptions([]);
      setGeneratedFlyer(null);

      try {
        const captionResult = await generateMarketingCaptions({
          productImage,
          productDescription,
        });

        if (!captionResult.captions || captionResult.captions.length === 0) {
          throw new Error('Gagal membuat caption.');
        }
        setGeneratedCaptions(captionResult.captions);

        const flyerResult = await generateProductFlyer({
          productImageUri: productImage,
          caption1: captionResult.captions[0],
          caption2: captionResult.captions[1],
          caption3: captionResult.captions[2],
        });

        if (!flyerResult.flyerImageUri) {
          throw new Error('Gagal membuat flyer.');
        }

        setGeneratedFlyer(flyerResult.flyerImageUri);
        deductCredits(2);

        addHistory({
          id: Date.now().toString(),
          productDescription,
          productImage,
          generatedCaptions: captionResult.captions,
          generatedFlyer: flyerResult.flyerImageUri,
          timestamp: Date.now(),
        });

        setGenerationState('success');
        toast({ title: 'Konten Berhasil Dibuat!', description: 'Caption dan flyer Anda sudah siap.' });
        

      } catch (error) {
        console.error(error);
        setGenerationState('error');
        toast({ title: 'Terjadi Kesalahan', description: 'Gagal membuat konten. Silakan coba lagi.', variant: 'destructive' });
      }
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
                <div className="relative flex h-64 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary hover:bg-muted">
                  <input id="product-image" type="file" accept="image/*" className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" onChange={handleImageUpload} />
                  {productImage ? (
                    <Image src={productImage} alt="Pratinjau Produk" fill className="object-contain p-2" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span>Klik untuk mengunggah atau seret gambar</span>
                      <span className="text-xs">PNG, JPG, WEBP</span>
                    </div>
                  )}
                </div>
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
              <Button onClick={handleGenerate} disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Buat Konten (2 Kredit)
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
              {generationState === 'idle' && (
                <div className="flex h-full flex-col items-center justify-center gap-4 rounded-lg bg-muted/50 p-8 text-center text-muted-foreground">
                  <Info className="h-12 w-12" />
                  <p>Hasil akan ditampilkan di sini setelah Anda membuat konten.</p>
                </div>
              )}
              {generationState === 'generating' && (
                 <div className="space-y-6">
                    <div>
                        <Label className="text-lg font-semibold">Pilihan Caption</Label>
                        <div className="mt-2 space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-5/6" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </div>
                    <div>
                        <Label className="text-lg font-semibold">Hasil Flyer</Label>
                        <Skeleton className="mt-2 aspect-[4/3] w-full" />
                    </div>
                 </div>
              )}
              {(generationState === 'success' || generationState === 'error') && (generatedCaptions.length > 0 || generatedFlyer) && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-headline text-lg">Pilihan Caption</h3>
                    <div className="space-y-3">
                      {generatedCaptions.map((caption, index) => (
                        <div key={index} className="flex items-start gap-3 rounded-md border bg-background p-3">
                           <Sparkles className="h-4 w-4 flex-shrink-0 mt-1 text-primary"/>
                           <p className="text-sm">{caption}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                   <div>
                    <h3 className="mb-2 font-headline text-lg">Hasil Flyer</h3>
                    {generatedFlyer ? (
                       <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border">
                         <Image src={generatedFlyer} alt="Generated Product Flyer" layout="fill" objectFit="contain" />
                       </div>
                    ) : (
                      <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">Flyer tidak dapat dibuat.</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetState} disabled={isPending}>Buat Lagi</Button>
                <Button onClick={handleDownloadFlyer} disabled={!generatedFlyer || isPending}>
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
