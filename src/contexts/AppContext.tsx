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
import { ref, onValue, set, get } from 'firebase/database';

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
      setIsLoading(false);
      if (currentUser) {
        // If user is logged in, ensure they are on the main page.
        // This handles redirect after login.
        if (router.pathname === '/login') {
            router.push('/');
        }
      } else {
        // If user is not logged in, push to login page.
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      const creditsRef = ref(db, `users/${user.uid}/credits`);
      
      const unsubscribe = onValue(creditsRef, (snapshot) => {
        const creditsVal = snapshot.val();
        // If credits don't exist in DB, it's a new user. Set 10 credits.
        if (creditsVal === null) {
          set(creditsRef, 10);
        } else {
          setCredits(creditsVal);
        }
      });

      return () => unsubscribe();
    } else {
      setCredits(0); // Reset credits on logout
    }
  }, [user]);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      // First, try to sign in. This is the most common case.
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      // If sign-in fails because the user is not found, create a new account.
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          // Before creating, check if the email is already linked to a Google account.
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('google.com')) {
              throw new Error('Akun ini terdaftar melalui Google. Silakan masuk menggunakan Google.');
          }
          await createUserWithEmailAndPassword(auth, email, pass);
        } catch (creationError: any) {
          // Handle specific creation errors or re-throw a generic one.
          if (creationError.code === 'auth/email-already-in-use') {
             throw new Error('Email ini sudah terdaftar. Silakan coba masuk.');
          }
          throw creationError;
        }
      } else {
        // For other sign-in errors (like wrong password), re-throw them.
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
    // Render nothing or a loading spinner while checking auth state
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
