'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" fill="currentColor">
      <path d="M44.5 20H24v8.5h11.8C34.9 33.7 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.3 29.6 2 24 2 12.3 2 3 11.3 3 23s9.3 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.1-.5-3z"/>
    </svg>

);


export default function LoginPage() {
  if (auth.currentUser) {
    redirect('/')
  }
  const { loginWithGoogle } = useAppContext();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Redirect handled by AppContext
    } catch (error: any) {
      toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
    }
  };

  const bgImage = PlaceHolderImages.find((img) => img.id === 'login-background');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="object-cover"
          data-ai-hint={bgImage.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
      <Card className="z-10 w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary p-2">
              <Image src="/logo.png" alt="TokoBoost AI Logo" width={40} height={40} className="h-10 w-10" />
            </div>
          </div>
          <CardTitle className="font-headline text-3xl">TokoBoost-AI</CardTitle>
          <CardDescription>Generate caption & desain brosur otomatis dengan AI. Masuk dengan akun Google Anda untuk memulai.</CardDescription>
        </CardHeader>
        <CardContent>
           {/* Form dihapus */}
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} type="button">
            <GoogleIcon className="mr-2 h-5 w-5" /> Masuk dengan Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
