'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wand2, Coins, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import PricingModal from './PricingModal';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { credits, logout } = useAppContext();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Wand2 className="h-7 w-7 text-primary" />
              <span className="font-headline text-xl font-bold md:text-2xl">TokoBoost</span>
            </Link>
          </div>
          <div className="flex items-center gap-1 md:gap-4">
            <div className="flex h-9 min-w-[5rem] items-center justify-center gap-2 rounded-full bg-secondary px-3 text-sm font-medium">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span>{credits}</span>
            </div>
            <Button onClick={() => setIsPricingModalOpen(true)} size="sm">
              Top Up
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
