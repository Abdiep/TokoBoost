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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

type GenerationState = 'idle' | 'generating' | 'success' | 'error';

// --- PERUBAHAN 1: Update biaya kredit menjadi 3 ---
const CREDITS_TO_DEDUCT = 3;

export default function AppPage() {
  const { isLoggedIn, credits, user, addCredits } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [productImage, setProductImage] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  // --- PERUBAHAN 2: State untuk caption dihapus, hanya ada state untuk gambar ---
  const [generatedFlyers, setGeneratedFlyers] = useState<string[]>([]);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [errorMessage, setErrorMessage] = useState('Terjadi kesalahan. Silakan coba lagi.');

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
        toast({ title: 'Gambar Terlalu Besar', description: 'Ukuran gambar tidak boleh melebihi 4MB.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!productImage || !productDescription) {
      toast({ title: 'Data Tidak Lengkap', description: 'Harap unggah gambar dan isi deskripsi produk.', variant: 'destructive' });
      return;
    }
    if (credits < CREDITS_TO_DEDUCT) {
      toast({ title: 'Kredit Tidak Cukup', description: `Anda memerlukan ${CREDITS_TO_DEDUCT} kredit untuk membuat konten. Silakan top up.`, variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: "Sesi tidak valid, harap login kembali.", variant: "destructive" });
      router.push('/login');
      return;
    }

    setGenerationState('generating');
    setGeneratedFlyers([]);

    addCredits(-CREDITS_TO_DEDUCT);

    startTransition(async () => {
      try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productImage, productDescription }),
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Terjadi kesalahan di server (status: ${response.status}).`);
        }
        
        // --- PERUBAHAN 3: Hanya menyimpan hasil gambar, tidak ada caption ---
        setGeneratedFlyers(result.flyerImageUris); 
        
        setGenerationState('success');
        toast({
          title: 'Pembuatan Gambar Berhasil!',
          description: 'Dua gambar baru Anda telah siap.',
        });

      } catch (error: any) {
        addCredits(CREDITS_TO_DEDUCT);
        console.error('AI Generation Error:', error);
        setErrorMessage(error.message || 'Gagal membuat konten. Silakan coba lagi.');
        setGenerationState('error');
        toast({
          title: 'Terjadi Kesalahan',
          description: `Gagal memproses permintaan AI. Kredit Anda telah dikembalikan.`,
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleDownloadFlyer = (index: number) => {
    if (generatedFlyers[index]) {
      const link = document.createElement('a');
      link.href = generatedFlyers[index];
      link.download = `flyer-produk-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetState = () => {
    setProductImage(null);
    setProductDescription('');
    setGeneratedFlyers([]);
    setGenerationState('idle');
  };

  if (!isLoggedIn) {
    return (<div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>);
  }

  const isLoading = generationState === 'generating';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* KOLOM INPUT (Tidak ada perubahan) */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <FileText /> 1. Masukkan Detail Produk
              </CardTitle>
              <CardDescription>Unggah gambar dan tulis deskripsi singkat produk Anda. Proses ini membutuhkan {CREDITS_TO_DEDUCT} kredit.</CardDescription>
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
                        <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}><ImageIcon className="mr-2 h-4 w-4" />Galeri</Button>
                        <Button variant="outline" className="w-full" onClick={() => cameraInputRef.current?.click()}><Camera className="mr-2 h-4 w-4" />Kamera</Button>
                      </div>
                    </div>
                  )}
                </div>
                {productImage && (<Button variant="link" className="w-full" onClick={() => setProductImage(null)}>Hapus Gambar</Button>)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-description">Deskripsi Produk</Label>
                <Textarea
                  id="product-description"
                  placeholder="Contoh: Sepatu lari ringan dengan teknologi bantalan terbaru..."
                  rows={5}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerate} disabled={isLoading || !productImage || !productDescription} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isLoading ? 'Membuat Gambar...' : `Buat Gambar (${CREDITS_TO_DEDUCT} Kredit)`}
              </Button>
            </CardFooter>
          </Card>

          {/* KOLOM OUTPUT */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl"><Sparkles />2. Hasil Generasi AI</CardTitle>
              <CardDescription>Dua variasi gambar yang dihasilkan oleh AI akan muncul di sini.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              {/* --- PERUBAHAN 4: Tampilan Output Disederhanakan Total --- */}
              {generationState === 'idle' && (<div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center text-muted-foreground"><Info className="h-12 w-12" /><p>Hasil akan ditampilkan di sini.</p></div>)}
              {generationState === 'generating' && (<div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center text-muted-foreground"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="font-semibold">AI sedang bekerja...</p><p>Proses ini bisa memakan waktu hingga satu menit.</p></div>)}
              {generationState === 'error' && (<div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center text-destructive"><AlertTriangle className="h-12 w-12" /><p className="font-semibold">Gagal Menghasilkan Gambar</p><p className="text-sm">{errorMessage}</p><Button variant="destructive" onClick={handleGenerate}>Coba Lagi</Button></div>)}
              
              {generationState === 'success' && (
                <div className="w-full flex flex-col items-center justify-center gap-4">
                  {generatedFlyers.length > 0 ? (
                    <Carousel className="w-full max-w-xs">
                      <CarouselContent>
                        {generatedFlyers.map((flyerUrl, index) => (
                          <CarouselItem key={index}>
                            <div className="p-1">
                              <Card>
                                <CardContent className="flex aspect-[9/16] items-center justify-center p-0 relative rounded-lg overflow-hidden group">
                                  <Image src={flyerUrl} alt={`Generated Flyer ${index + 1}`} fill className="object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button size="icon" variant="ghost" onClick={() => handleDownloadFlyer(index)} title={`Unduh Gambar ${index + 1}`}>
                                      <Download className="h-8 w-8 text-white" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  ) : (
                    <div className='flex items-center justify-center h-full text-muted-foreground text-sm'><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang memuat gambar...</div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={resetState} disabled={isLoading || generationState !== 'success'}>Buat Lagi</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}