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
        if (router.pathname !== '/') {
            router.push('/');
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      const creditsRef = ref(db, `users/${user.uid}/credits`);
      
      // Check if user exists in DB, if not, initialize with 10 credits
      get(creditsRef).then((snapshot) => {
        if (!snapshot.exists()) {
          set(creditsRef, 10);
        }
      });

      // Listen for real-time updates on credits
      const unsubscribe = onValue(creditsRef, (snapshot) => {
        const newCredits = snapshot.val();
        if (typeof newCredits === 'number') {
          setCredits(newCredits);
        } else if (newCredits === null) {
            set(creditsRef, 10);
        }
      });

      return () => unsubscribe();
    } else {
      setCredits(0); // Reset credits on logout
    }
  }, [user]);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      // Check if the user exists first
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length === 0) {
        // User does not exist, create a new account
        await createUserWithEmailAndPassword(auth, email, pass);
      } else if (methods.includes('password')) {
        // User exists with email/password, try to sign in
        await signInWithEmailAndPassword(auth, email, pass);
      } else if (methods.includes('google.com')) {
        // User exists but signed up with Google
        throw new Error('Akun ini terdaftar melalui Google. Silakan masuk menggunakan Google.');
      } else {
        // Other methods not handled in this app
         throw new Error('Metode login tidak didukung untuk email ini.');
      }
    } catch (error: any) {
      // Re-throw specific errors for the UI to handle
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          throw new Error('Password yang Anda masukkan salah.');
      }
      throw error;
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
