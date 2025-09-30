'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  Unsubscribe
} from 'firebase/auth';
import { ref, onValue, set, get } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';


interface AppContextType {
  isLoggedIn: boolean;
  user: User | null;
  credits: number;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
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
    let unsubscribeDb: Unsubscribe | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (unsubscribeDb) {
        unsubscribeDb();
        unsubscribeDb = undefined;
      }
      
      if (currentUser) {
        const creditsRef = ref(db, `users/${currentUser.uid}/credits`);
        unsubscribeDb = onValue(creditsRef, (snapshot) => {
          setCredits(snapshot.val() ?? 0);
        }, (error) => {
          console.error("Firebase onValue error:", error);
          toast({ title: "Error", description: "Gagal memuat data kredit.", variant: "destructive" });
          setCredits(0);
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
  }, [toast]);
  
  useEffect(() => {
    if (!isAuthLoading && !user && !PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      router.push('/login');
    }
  }, [isAuthLoading, user, pathname, router]);


  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const newUser = userCredential.user;
            await set(ref(db, `users/${newUser.uid}/credits`), 10);
            router.push('/');
          } catch (creationError: any) {
             if (creationError.code === 'auth/email-already-in-use') {
                toast({ title: "Login Gagal", description: 'Email sudah terdaftar dengan metode lain.', variant: "destructive" });
             } else {
                toast({ title: "Pendaftaran Gagal", description: creationError.message, variant: "destructive" });
             }
             throw creationError;
          }
        } else {
            toast({ title: "Login Gagal", description: error.message, variant: "destructive" });
            throw error;
        }
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userRef = ref(db, `users/${googleUser.uid}/credits`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, 10);
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
      const newCredits = credits - amount;
      const creditsRef = ref(db, `users/${user.uid}/credits`);
      set(creditsRef, newCredits);
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    if (user) {
      const newCredits = credits + amount;
      const creditsRef = ref(db, `users/${user.uid}/credits`);
      set(creditsRef, newCredits);
    }
  };

  const value = {
    isLoggedIn: !!user,
    user,
    credits,
    loginWithEmail,
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
