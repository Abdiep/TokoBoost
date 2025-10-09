'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Hanya butuh auth dari client
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, runTransaction } from 'firebase/firestore'; // Import firestore
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/lib/errors';
import { errorEmitter } from '@/lib/error-emitter';

interface AppContextType {
  isLoggedIn: boolean;
  user: User | null;
  credits: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  addCredits: (amount: number) => Promise<void>;
  deductCredits: (amount: number) => Promise<void>;
  userEmail: string | null;
  refreshCredits: () => Promise<void>;
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
  const db = getFirestore();

  // Step 1: Handle Auth State Changes ONLY
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);
  
  // Step 2: React to the user object being set
  useEffect(() => {
    if (user) {
      refreshCredits();
    } else {
      setCredits(0);
    }
  }, [user]);

  // Step 3: Handle routing based on auth state
  useEffect(() => {
    if (isAuthLoading) {
      return; 
    }
    const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p));
    if (!user && !isPublicPage) {
      router.push('/login');
    }
    if (user && pathname === '/login') {
      router.push('/');
    }
  }, [user, isAuthLoading, pathname, router]);

  const refreshCredits = async () => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            setCredits(docSnap.data().credits ?? 0);
        } else {
            setCredits(0);
        }
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      const userDocRef = doc(db, 'users', googleUser.uid);
      
      try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          const newUser = {
              displayName: googleUser.displayName,
              email: googleUser.email,
              credits: 10, // Initial credits
              createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newUser);
          setCredits(10); // Manually set credits on client
          toast({ title: 'Login Berhasil', description: 'Selamat datang! Anda mendapat 10 kredit gratis.' });
          router.push('/');
        } else {
          setCredits(docSnap.data().credits ?? 0); // Set credits from existing doc
          toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
          router.push('/');
        }
      } catch (dbError: any) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: docSnap.exists() ? 'get' : 'create',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
        }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null); // Explicitly set user to null
    router.push('/login');
  };
  
  const modifyCredits = async (amount: number) => {
    if (!user) {
        toast({ title: "Anda tidak login", description: "Silakan login untuk mengubah kredit.", variant: "destructive" });
        return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("Dokumen pengguna tidak ditemukan.");
            }
            const currentCredits = userDoc.data().credits ?? 0;
            const newCredits = currentCredits + amount;
            if (newCredits < 0) {
                throw new Error("Kredit tidak cukup.");
            }
            transaction.update(userDocRef, { credits: newCredits });
        });
        // After successful transaction, update state
        await refreshCredits();
    } catch (error: any) {
         if (error.code === 'permission-denied' || error.message.includes('permission')) {
             const permissionError = new FirestorePermissionError({
                 path: userDocRef.path,
                 operation: 'update',
                 requestResourceData: { credits: `current_credits + ${amount}` }, 
             });
             errorEmitter.emit('permission-error', permissionError);
         } else {
             toast({ title: "Gagal Memperbarui Kredit", description: error.message, variant: "destructive" });
         }
         // Re-throw to inform the caller
         throw error;
    }
  };

  const addCredits = async (amount: number) => {
    await modifyCredits(amount);
  };
  const deductCredits = async (amount: number) => {
    await modifyCredits(-amount);
  };

  const value = {
    isLoggedIn: !!user,
    user,
    credits,
    loginWithGoogle,
    logout,
    addCredits,
    deductCredits,
    userEmail: user?.email || null,
    refreshCredits,
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
