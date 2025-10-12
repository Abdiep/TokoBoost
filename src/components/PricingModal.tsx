'use client';

import { useState } from 'react';
import Script from 'next/script'; // 1. Impor komponen Script
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 2. Deklarasikan tipe untuk window.snap agar TypeScript tidak error
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
    { name: 'UMKM', credits: 25, price: 29000, features: ['25 Kredit'], tag: null },
    { name: 'Toko', credits: 160, price: 119000, popular: true, features: ['150 Kredit + 10 Bonus'], tag: "Best Value" },
    { name: 'Mall', credits: 530, price: 349000, features: ['500 Kredit + 30 Bonus'], tag: "Hemat 40%" },
];

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { addCredits, user, userEmail } = useAppContext();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleTopUp = async (plan: typeof plans[0]) => {
    if (!user) {
      toast({
        title: 'Anda Belum Login',
        description: 'Silakan login terlebih dahulu untuk melakukan top up.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(plan.name);

    try {
      const userData = {
        firstName: user?.displayName?.split(' ')[0] || "Pengguna",
        lastName: user?.displayName?.split(' ').slice(1).join(' ') || "TokoBoost-AI",
        email: userEmail || "email@tidakada.com",
        phone: user?.phoneNumber || "08123456789",
      };

      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, user: userData }),
      });

      const transaction = await response.json();

      if (response.status !== 200) {
        throw new Error(transaction.error || 'Gagal membuat transaksi.');
      }
      
      const { token } = transaction;

      onClose();

      setTimeout(() => {
        window.snap.pay(token, {
          onSuccess: (result) => {
            console.log('Payment Success:', result);
            addCredits(plan.credits);
            toast({
              title: 'Top Up Berhasil!',
              description: `Anda telah berhasil menambahkan ${plan.credits} kredit.`,
            });
            setIsProcessing(null);
          },
          onPending: (result) => {
            console.log('Payment Pending:', result);
            toast({
              title: 'Menunggu Pembayaran',
              description: 'Selesaikan pembayaran Anda.',
            });
            setIsProcessing(null);
          },
          onError: (result) => {
            console.error('Payment Error:', result);
            toast({
              title: 'Pembayaran Gagal',
              description: 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
              variant: 'destructive'
            });
            setIsProcessing(null);
          },
          onClose: () => {
            console.log('Payment popup closed');
            if (isProcessing) {
               setIsProcessing(null);
            }
          },
        });
      }, 300);

    } catch (error: any) {
      console.error("Handle Top Up Error:", error);
      toast({
        title: 'Error',
        description: error.message || 'Terjadi kesalahan.',
        variant: 'destructive',
      });
      setIsProcessing(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* 3. Panggil skrip snap.js dari Midtrans di sini */}
      <Script
        src="https://app.midtrans.com/snap/snap.js" // URL Produksi
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload" // Load saat dibutuhkan untuk performa
      />

      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center font-headline text-3xl">Pilih Paket Kredit Anda</DialogTitle>
          <DialogDescription className="text-center">
            Pilih paket yang paling sesuai dengan kebutuhan bisnis Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary ring-2 ring-primary' : ''}`}>
              {plan.tag && (
                <div className={`px-3 py-1 text-center text-sm font-semibold ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{plan.tag}</div>
              )}
              <CardHeader className="items-center text-center">
                <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-4xl font-bold">Rp {plan.price.toLocaleString('id-ID')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="mr-2 mt-1 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <DialogFooter className="p-6 pt-0">
                <Button onClick={() => handleTopUp(plan)} disabled={isProcessing !== null} className="w-full">
                  {isProcessing === plan.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isProcessing === plan.name ? 'Memproses...' : 'Pilih Paket'}
                </Button>
              </DialogFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}