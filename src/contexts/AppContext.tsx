'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { ref, onValue, set, get, increment, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  isLoggedIn: boolean;
  user: User | null;
  credits: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  userEmail: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/syarat-dan-ketentuan', '/privasi', '/kontak-kami', '/tentang-kami'];

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeDb: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
  
      if (unsubscribeDb) {
        unsubscribeDb();
      }
  
      if (currentUser) {
        const creditsRef = ref(db, `users/${currentUser.uid}/credits`);
        unsubscribeDb = onValue(creditsRef, (snapshot) => {
          setCredits(snapshot.val() ?? 0);
        });
      } else {
        setCredits(0);
      }
    });
  
    return () => {
      unsubscribeAuth();
      if (unsubscribeDb) {
        unsubscribeDb();
      }
    };
  }, []);
  
  useEffect(() => {
    if (isAuthLoading) {
      return; 
    }
  
    const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  
    if (!user && !isPublicPage) {
      router.push('/login');
    }
  
    if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, isAuthLoading, pathname, router]);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userRef = ref(db, `users/${googleUser.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(ref(db, `users/${googleUser.uid}/credits`), 10);
        toast({ title: 'Login Berhasil', description: 'Selamat datang! Anda mendapat 10 kredit gratis.' });
      } else {
        toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
      }
      router.push('/');
    } catch (error: any) {
        toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
        throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const deductCredits = (amount: number) => {
    if (user && credits >= amount) {
      const creditsRef = ref(db, `users/${user.uid}`);
       update(creditsRef, {
        credits: increment(-amount)
      });
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    if (user) {
      const creditsRef = ref(db, `users/${user.uid}`);
      update(creditsRef, {
        credits: increment(amount)
      });
    }
  };

  const value = {
    isLoggedIn: !!user,
    user,
    credits,
    loginWithGoogle,
    logout,
    deductCredits,
    addCredits,
    userEmail: user?.email || null,
  };
  
  if (isAuthLoading) {
    return null;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
