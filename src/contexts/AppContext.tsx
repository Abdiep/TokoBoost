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
import { ref, set, get, runTransaction, onValue } from 'firebase/database';
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthCheckComplete(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthCheckComplete) {
      return;
    }

    if (user) {
      // Once authenticated, set up a listener for credit changes
      const userCreditsRef = ref(db, `users/${user.uid}/credits`);
      const unsubscribe = onValue(userCreditsRef, (snapshot) => {
        const newCredits = snapshot.val() ?? 0;
        setCredits(newCredits);
      });
      return () => unsubscribe(); // Cleanup listener on unmount or user change
    }
  }, [user, isAuthCheckComplete]);


  useEffect(() => {
    if (!isAuthCheckComplete) {
      return;
    }

    const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p));

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && pathname === '/login') {
      router.push('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthCheckComplete, pathname, router]);

  const refreshCredits = async () => {
    if (!user) {
        console.warn("refreshCredits called without a user.");
        return;
    }
    const userRef = ref(db, 'users/' + user.uid);
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            setCredits(snapshot.val().credits ?? 0);
        } else {
            console.warn("User data doesn't exist, can't refresh credits.");
            setCredits(0);
        }
    } catch (error) {
        console.error("Error refreshing credits:", error);
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      const userRef = ref(db, 'users/' + googleUser.uid);
      
      try {
          const snapshot = await get(userRef);
          if (!snapshot.exists()) {
            const newUser = {
                displayName: googleUser.displayName,
                email: googleUser.email,
                credits: 10,
                createdAt: new Date().toISOString(),
            };
            await set(userRef, newUser);
            // setCredits(10) is handled by the onValue listener now
            toast({ title: 'Login Berhasil', description: 'Selamat datang! Anda mendapat 10 kredit gratis.' });
          } else {
            // setCredits(snapshot.val().credits ?? 0) is handled by onValue
            toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
          }
      } catch (dbError) {
          console.error("Database error after login:", dbError);
          toast({ title: "Error Database", description: "Gagal menyimpan atau membaca data pengguna.", variant: "destructive" });
      }
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
        }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setCredits(0);
    router.push('/login');
  };
  
  const addCredits = async (amount: number) => {
    if (!user) {
        toast({ title: "Anda tidak login", description: "Silakan login untuk mengubah kredit.", variant: "destructive" });
        return;
    }
    const userCreditsRef = ref(db, `users/${user.uid}/credits`);
    try {
        await runTransaction(userCreditsRef, (currentCredits) => {
            return (currentCredits || 0) + amount;
        });
        // State will be updated by the onValue listener
    } catch (error: any) {
        console.error("Error adding credits:", error);
        toast({ title: "Gagal Menambah Kredit", description: error.message, variant: "destructive" });
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
