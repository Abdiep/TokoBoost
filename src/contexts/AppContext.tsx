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
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
    } else {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      const creditsRef = ref(db, `users/${user.uid}/credits`);
      
      const unsubscribeDb = onValue(creditsRef, (snapshot) => {
        const creditsVal = snapshot.val();
        if (creditsVal === null) {
          // User is new or doesn't have a credit entry, set initial credits.
          // This will trigger onValue again with the new value.
          set(creditsRef, 10);
        } else {
          // User has a credit entry, update the state.
          setCredits(creditsVal);
        }
      });

      // Cleanup the listener when the user logs out or the component unmounts.
      return () => unsubscribeDb();
    } else {
      // If there is no user, reset credits to 0.
      setCredits(0);
    }
  }, [user]);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      // First, try to sign in. This is the most common case.
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      // If sign-in fails because the user is not found, try to create a new account.
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          // Before creating an account, check if the email is already used with another provider (like Google).
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('google.com')) {
              throw new Error('Akun ini terdaftar melalui Google. Silakan masuk menggunakan Google.');
          }
           if (methods.length === 0) {
            // If email is not registered with any method, proceed to create a new user.
            await createUserWithEmailAndPassword(auth, email, pass);
           } else {
            // This will handle the case where the email is registered but password is wrong
            throw new Error('Password salah atau terjadi kesalahan. Silakan coba lagi.');
           }
        } catch (creationError: any) {
          // Handle specific creation errors, like if email is already in use by another password account.
          if (creationError.code === 'auth/email-already-in-use') {
             throw new Error('Email ini sudah terdaftar. Silakan coba masuk.');
          }
          throw creationError; // Re-throw other creation errors
        }
      } else {
        // Re-throw other sign-in errors
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
    loginWithEmail,
    loginWithGoogle,
    logout,
    deductCredits,
    addCredits,
    userEmail: user?.email || null,
  };
  
  if (isLoading) {
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
