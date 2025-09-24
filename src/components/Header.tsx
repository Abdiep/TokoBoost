'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wand2, Coins, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import PricingModal from './PricingModal';

export default function Header() {
  const { credits, logout } = useAppContext();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Wand2 className="h-7 w-7 text-primary" />
              <span className="font-headline text-2xl font-bold">BrosurAI</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span>Kredit: {credits}</span>
            </div>
            <Button onClick={() => setIsPricingModalOpen(true)} size="sm">
              Isi Ulang
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} aria-label="Keluar">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
    </>
  );
}
