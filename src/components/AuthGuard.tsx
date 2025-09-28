// src/components/AuthGuard.tsx
'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Loader2 } from 'lucide-react';

const publicPaths = ['/login'];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isPublicPath = publicPaths.includes(pathname);

  if (!isLoggedIn && !isPublicPath) {
    router.replace(`/login?redirect=${pathname}`);
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoggedIn && isPublicPath) {
    router.replace('/');
     return (
       <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
