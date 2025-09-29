'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
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

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        if (window.location.pathname === '/login') {
          router.push('/');
        }
      } else {
        setCredits(0); // Reset credits on logout
        if (window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      const creditsRef = ref(db, `users/${user.uid}/credits`);
      const unsubscribeDb = onValue(creditsRef, (snapshot) => {
        const creditsVal = snapshot.val();
        if (creditsVal === null) {
          // User is new, set initial credits.
          // This will re-trigger this onValue listener.
          set(creditsRef, 10);
        } else {
          setCredits(creditsVal);
        }
      }, (error) => {
        console.error("Firebase onValue error:", error);
        toast({ title: "Error", description: "Gagal memuat data kredit.", variant: "destructive" });
      });

      // Cleanup the listener when the user logs out or the component unmounts.
      return () => unsubscribeDb();
    }
  }, [user, toast]);


  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, pass);
          } catch (creationError: any) {
             if (creationError.code === 'auth/email-already-in-use') {
                toast({ title: "Login Gagal", description: 'Email sudah terdaftar dengan metode lain (misal: Google). Silakan masuk menggunakan metode tersebut.', variant: "destructive" });
             } else {
                toast({ title: "Pendaftaran Gagal", description: creationError.message, variant: "destructive" });
             }
          }
        } else {
            toast({ title: "Login Gagal", description: error.message, variant: "destructive" });
        }
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
        toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
    }
  };

  const logout = async () => {
    await signOut(auth);
    // Redirect is handled by the useEffect watching the user state.
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
