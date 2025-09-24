'use client';

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
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  { name: 'UMKM', credits: 50, price: 'Rp 50.000', features: ['50 Kredit', 'Dukungan Email'] },
  { name: 'Toko', credits: 150, price: 'Rp 125.000', popular: true, features: ['150 Kredit', 'Dukungan Prioritas', 'Akses Fitur Beta'] },
  { name: 'Mall', credits: 500, price: 'Rp 350.000', features: ['500 Kredit', 'Dukungan Dedikasi', 'Analitik Penggunaan'] },
];

export default function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { addCredits } = useAppContext();
  const { toast } = useToast();

  const handleTopUp = (amount: number, name: string) => {
    addCredits(amount);
    toast({
      title: 'Isi Ulang Berhasil!',
      description: `Anda telah berhasil membeli paket ${name}. Kredit Anda telah ditambahkan.`,
    });
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
              {plan.popular && (
                <div className="bg-primary px-3 py-1 text-center text-sm font-semibold text-primary-foreground">Paling Populer</div>
              )}
              <CardHeader className="items-center text-center">
                <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-4xl font-bold">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                 <p className="text-center text-lg font-semibold">{plan.credits} Kredit</p>
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
                <Button onClick={() => handleTopUp(plan.credits, plan.name)} className="w-full">
                  Pilih Paket
                </Button>
              </DialogFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
