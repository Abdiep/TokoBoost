'use client';

import { useState } from 'react';
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

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SnapWindow extends Window {
  snap?: {
    pay: (token: string, options: {
      onSuccess: (result: any) => void;
      onPending: (result: any) => void;
      onError: (result: any) => void;
      onClose: () => void;
    }) => void;
  };
}

const plans = [
    { name: 'UMKM', credits: 25, price: 29000, features: ['25 Kredit'], tag: null },
    { name: 'Toko', credits: 160, price: 119000, popular: true, features: ['150 Kredit + 10 Bonus'], tag: "Best Value" },
    { name: 'Mall', credits: 530, price: 349000, features: ['500 Kredit + 30 Bonus'], tag: "Hemat 40%" },
];

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { addCredits, userEmail } = useAppContext();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleTopUp = async (plan: typeof plans[0]) => {
    setIsProcessing(plan.name);
    try {
      const response = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          userEmail,
        }),
      });

      const { token } = await response.json();

      if (token) {
        (window as SnapWindow).snap?.pay(token, {
          onSuccess: (result) => {
            addCredits(plan.credits);
            toast({
              title: 'Pembayaran Berhasil!',
              description: `Anda telah berhasil membeli paket ${plan.name}. Kredit Anda telah ditambahkan.`,
            });
            onClose();
          },
          onPending: (result) => {
            toast({
              title: 'Pembayaran Tertunda',
              description: 'Menunggu konfirmasi pembayaran Anda.',
            });
            onClose();
          },
          onError: (result) => {
            toast({
              title: 'Pembayaran Gagal',
              description: 'Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.',
              variant: 'destructive',
            });
            onClose();
          },
          onClose: () => {
             // Only show this toast if the payment was not successful
             // This can be determined by checking a state that onSuccess would set
          }
        });
      } else {
        throw new Error('Gagal mendapatkan token transaksi.');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Tidak dapat memulai sesi pembayaran. Silakan hubungi dukungan.',
        variant: 'destructive',
      });
    } finally {
        setIsProcessing(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center font-headline text-3xl">Pilih Paket Kredit Anda</DialogTitle>
          <DialogDescription className="text-center">
            Pilih paket yang paling sesuai dengan kebutuhan bisnis Anda. Pembayaran aman melalui Midtrans.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 py-8 md:grid-cols-3">
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
