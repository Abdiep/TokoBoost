'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Wand2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1.1 0-1.5.9-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/>
    </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithEmail, loginWithGoogle } = useAppContext();
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        toast({ title: "Error", description: "Email and password are required.", variant: "destructive" });
        return;
    }
    try {
      await loginWithEmail(email, password);
      // Redirect handled by AppContext listener
    } catch (error: any) {
      toast({ title: "Login Gagal", description: error.message, variant: "destructive" });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Redirect handled by AppContext listener
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
            <div className="rounded-full bg-primary p-3">
              <Wand2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-headline text-3xl">TokoBoost</CardTitle>
          <CardDescription>Generate caption & desain brosur otomatis dengan AI, biar produkmu langsung siap jual.</CardDescription>
        </CardHeader>
        <form onSubmit={handleEmailLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@anda.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password Anda"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">
              <LogIn className="mr-2" /> Masuk
            </Button>
            <div className="relative w-full">
                <Separator className="shrink-0" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    ATAU
                </span>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} type="button">
              <GoogleIcon className="mr-2 h-5 w-5" /> Masuk dengan Google
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
