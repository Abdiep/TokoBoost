'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Coins, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';
import PricingModal from './PricingModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Header() {
  const { logout, user, userEmail, credits } = useAppContext();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const getInitials = (email: string | null) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="TokoBoost AI Logo" width={32} height={32} className="h-8 w-8" />
              <span className="font-headline text-xl font-bold md:text-2xl">TokoBoost</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex h-9 min-w-[5rem] items-center justify-center gap-2 rounded-full bg-secondary px-3 text-sm font-medium">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span>{credits}</span>
            </div>
            <Button onClick={() => setIsPricingModalOpen(true)} size="sm">
              Top Up
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.photoURL || ''} alt="User avatar" />
                    <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Profil</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail || 'Tidak ada email'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
    </>
  );
}
