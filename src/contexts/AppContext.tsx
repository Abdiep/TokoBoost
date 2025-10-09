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
import { ref, get, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  isLoggedIn: boolean;
  user: User | null;
  credits: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  addCredits: (amount: number) => Promise<void>;
  userEmail: string | null;
  refreshCredits: () => Promise<void>;
  setCredits: (credits: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/syarat-dan-ketentuan', '/privasi', '/kontak-kami', '/tentang-kami'];

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // === Auth Listener ===
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthCheckComplete(true);
    });
    return () => unsubscribeAuth();
  }, []);

  // === Credits Listener ===
  useEffect(() => {
    if (!isAuthCheckComplete || !user) return;
    const userCreditsRef = ref(db, `users/${user.uid}/credits`);
    const unsubscribe = onValue(userCreditsRef, (snapshot) => {
      const newCredits = snapshot.val() ?? 0;
      setCredits(newCredits);
    });
    return () => unsubscribe();
  }, [user, isAuthCheckComplete]);

  // === Routing Guard ===
  useEffect(() => {
    if (!isAuthCheckComplete) return;
    const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p));

    if (!user && !isPublicPage) router.push('/login');
    else if (user && pathname === '/login') router.push('/');
  }, [user, isAuthCheckComplete, pathname, router]);

  // === Refresh Credits Manual ===
  const refreshCredits = async () => {
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    try {
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setCredits(snapshot.val().credits ?? 0);
      }
    } catch (error) {
      console.error("Error refreshing credits:", error);
    }
  };

  // === Login via Google (panggil API init-user) ===
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // panggil API untuk init user di server
      await fetch('/api/init-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: googleUser.uid,
          email: googleUser.email,
          name: googleUser.displayName,
        }),
      });

      toast({ title: 'Login Berhasil', description: 'Selamat datang!' });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
      }
    }
  };

  // === Logout ===
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setCredits(0);
    router.push('/login');
  };

  // === Top Up (via API) ===
  const addCredits = async (amount: number) => {
    if (!user) {
      toast({ title: "Anda belum login", description: "Silakan login terlebih dahulu.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch('/api/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, amount }),
      });
      if (!res.ok) throw new Error('Gagal menambah kredit');
      toast({ title: "Top Up Berhasil", description: `Kredit bertambah ${amount}` });
    } catch (error: any) {
      console.error("Error adding credits:", error);
      toast({ title: "Top Up Gagal", description: error.message, variant: "destructive" });
    }
  };

  const value = {
    isLoggedIn: !!user,
    user,
    credits,
    loginWithGoogle,
    logout,
    addCredits,
    userEmail: user?.email || null,
    refreshCredits,
    setCredits,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
