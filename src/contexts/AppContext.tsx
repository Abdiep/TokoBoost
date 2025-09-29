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
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';

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
  const [isCreditsLoading, setIsCreditsLoading] = useState(true);
  const router = useRouter();

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
      if (window.location.pathname !== '/login') {
          router.push('/login');
      }
    } else {
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
          // User is new, set initial credits. This will trigger onValue again.
          set(creditsRef, 10);
        } else {
          setCredits(creditsVal);
          setIsCreditsLoading(false);
        }
      }, (error) => {
        console.error("Firebase onValue error:", error);
        setIsCreditsLoading(false);
      });

      // Cleanup the listener when the user logs out or the component unmounts.
      return () => unsubscribeDb();
    } else {
      // If there is no user, reset credits and loading state.
      setCredits(0);
      setIsCreditsLoading(true);
    }
  }, [user]);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          // If user not found or invalid credential on first try, attempt to create a new user.
          // This handles both new users and incorrect passwords for existing users.
          try {
            await createUserWithEmailAndPassword(auth, email, pass);
          } catch (creationError: any) {
            // If creation fails (e.g., email already in use by another provider), throw an error.
             if (creationError.code === 'auth/email-already-in-use') {
                throw new Error('Email sudah terdaftar. Jika Anda mendaftar dengan Google, silakan masuk menggunakan Google.');
             }
            throw creationError;
          }
        } else {
            // Re-throw other errors (e.g., network issues)
            throw error;
        }
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
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
