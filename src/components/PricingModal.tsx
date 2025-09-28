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

const plans = [
    { name: 'UMKM', credits: 25, price: 29000, features: ['25 Kredit'], tag: null },
    { name: 'Toko', credits: 160, price: 119000, popular: true, features: ['150 Kredit + 10 Bonus'], tag: "Best Value" },
    { name: 'Mall', credits: 530, price: 349000, features: ['500 Kredit + 30 Bonus'], tag: "Hemat 40%" },
];

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { addCredits } = useAppContext();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleTopUp = async (plan: typeof plans[0]) => {
    setIsProcessing(plan.name);

    // Simulate a short delay for better user experience
    await new Promise(resolve => setTimeout(resolve, 500));

    addCredits(plan.credits);
    toast({
      title: 'Top Up Berhasil!',
      description: `Anda telah berhasil menambahkan ${plan.credits} kredit dari paket ${plan.name}.`,
    });
    
    setIsProcessing(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center font-headline text-3xl">Pilih Paket Kredit Anda</DialogTitle>
          <DialogDescription className="text-center">
            Pilih paket yang paling sesuai dengan kebutuhan bisnis Anda.
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
