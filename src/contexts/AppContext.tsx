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
  isCreditsLoading: boolean;
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
  // We keep isCreditsLoading to give feedback on the UI, but simplify its logic.
  const [isCreditsLoading, setIsCreditsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      // If there's no user and we're not on the login page, redirect.
      if (window.location.pathname !== '/login') {
        router.push('/login');
      }
    } else {
      // If there is a user and we are on the login page, redirect to home.
      if (window.location.pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user) {
      setIsCreditsLoading(true);
      const creditsRef = ref(db, `users/${user.uid}/credits`);
      
      const unsubscribeDb = onValue(creditsRef, (snapshot) => {
        const creditsVal = snapshot.val();
        if (creditsVal === null) {
          // User is new, set initial credits. 
          // This will re-trigger this onValue listener.
          set(creditsRef, 10);
        } else {
          setCredits(creditsVal);
          setIsCreditsLoading(false);
        }
      }, (error) => {
        console.error("Firebase onValue error:", error);
        toast({ title: "Error", description: "Gagal memuat data kredit.", variant: "destructive" });
        setIsCreditsLoading(false);
      });

      // Cleanup the listener when the user logs out or the component unmounts.
      return () => unsubscribeDb();
    } else {
      // If there is no user, reset credits and loading state.
      setCredits(0);
      setIsCreditsLoading(true); // Set to true since there's no user to load credits for.
    }
  }, [user, toast]);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      // First, try to sign in.
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        // If user not found, try to create a new account.
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email, pass);
          } catch (creationError: any) {
             if (creationError.code === 'auth/email-already-in-use') {
                toast({ title: "Login Gagal", description: 'Email sudah terdaftar. Jika Anda mendaftar dengan Google, silakan masuk menggunakan Google.', variant: "destructive" });
             } else {
                toast({ title: "Login Gagal", description: creationError.message, variant: "destructive" });
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
    // Redirect is handled by the useEffect watching the `user` state.
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
    isCreditsLoading,
    loginWithEmail,
    loginWithGoogle,
    logout,
    deductCredits,
    addCredits,
    userEmail: user?.email || null,
  };
  
  if (isAuthLoading) {
    // Render nothing or a full-page loader while auth state is being determined.
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
