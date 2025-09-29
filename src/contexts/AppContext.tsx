'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';

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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch credits from DB or use localStorage for now
        const storedCredits = localStorage.getItem(`userCredits_${currentUser.uid}`);
        setCredits(storedCredits ? parseInt(storedCredits, 10) : 10); // Default 10 credits for new user
      } else {
        setCredits(0);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
        try {
            localStorage.setItem(`userCredits_${user.uid}`, credits.toString());
        } catch (error) {
            console.error("Failed to write to localStorage", error);
        }
    }
  }, [user, credits, isLoading]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user not found, create a new one
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
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
    // Clear all local storage on logout for safety
    try {
        localStorage.clear();
    } catch (error) {
        console.error("Failed to clear localStorage", error);
    }
  };

  const deductCredits = (amount: number) => {
    if (credits >= amount) {
      setCredits((prev) => prev - amount);
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    setCredits((prev) => prev + amount);
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

  if (isLoading) {
    return null; // Or a loading spinner
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
