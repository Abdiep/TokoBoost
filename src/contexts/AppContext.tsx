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
import { ref, onValue, runTransaction, get, set } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  isLoggedIn: boolean;
  user: User | null;
  credits: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  userEmail: string | null;
  addCredits: (amount: number) => void;
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

  const initUserInDB = async (user: User) => {
    if (!user) return;
    const userRef = ref(db, `users/${user.uid}`);
    try {
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          email: user.email,
          name: user.displayName || '',
          credits: 10,
          createdAt: new Date().toISOString(),
        });
        setCredits(10); // Set local state immediately
        console.log(`✅ User ${user.email} berhasil dibuat dengan 10 kredit.`);
      } else {
        setCredits(snapshot.val().credits || 0);
      }
    } catch (error) {
      console.error('❌ Error init-user:', error);
      toast({ title: "Gagal memuat data pengguna", variant: "destructive" });
    }
  };

  const addCredits = (amount: number) => {
    if (!user) return;
    const userCreditsRef = ref(db, `users/${user.uid}/credits`);
    runTransaction(userCreditsRef, (currentCredits) => {
      const newCredits = (currentCredits || 0) + amount;
      // Prevent credits from going below zero
      return newCredits < 0 ? 0 : newCredits;
    }).catch((error) => {
      console.error("Transaction failed: ", error);
      toast({
        title: "Gagal Memperbarui Kredit",
        description: "Terjadi kesalahan saat mengubah jumlah kredit Anda. Silakan coba lagi.",
        variant: "destructive"
      });
    });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthCheckComplete(true);
      if (currentUser) {
        initUserInDB(currentUser);
      } else {
        // Clear credits when user logs out
        setCredits(0);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    };
    // Set up a listener for real-time credit updates
    const userCreditsRef = ref(db, `users/${user.uid}/credits`);
    const unsubscribe = onValue(userCreditsRef, (snapshot) => {
      const newCredits = snapshot.val() ?? 0;
      setCredits(newCredits);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isAuthCheckComplete) return;
    const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p));
    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, isAuthCheckComplete, pathname, router]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // initUserInDB will be called by onAuthStateChanged listener
      toast({ title: 'Login Berhasil', description: 'Selamat datang!' });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const value = {
    isLoggedIn: !!user,
    user,
    credits,
    loginWithGoogle,
    logout,
    userEmail: user?.email || null,
    addCredits,
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
