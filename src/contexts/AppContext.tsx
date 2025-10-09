'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
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
  const db = getFirestore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthCheckComplete(true);
      // **REMOVED AUTOMATIC REFRESH CREDITS** This was the source of the race condition.
      // Credits will now be fetched ONLY after a successful login.
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthCheckComplete) {
      return;
    }

    const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p));

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && pathname === '/login') {
      // If user is logged in, fetch their credits before redirecting.
      // This ensures credits are available on the main page.
      refreshCredits().then(() => {
        router.push('/');
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthCheckComplete, pathname, router]);

  const refreshCredits = async () => {
    if (!user) {
        console.warn("refreshCredits called without a user.");
        return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            setCredits(docSnap.data().credits ?? 0);
        } else {
            console.warn("User document doesn't exist, can't refresh credits.");
            setCredits(0);
        }
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        // Throwing the error is important for debugging with the overlay
        throw error;
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
                credits: 10,
                createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUser);
            setCredits(10);
            toast({ title: 'Login Berhasil', description: 'Selamat datang! Anda mendapat 10 kredit gratis.' });
          } else {
            setCredits(docSnap.data().credits ?? 0);
            toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
          }
          // No need to redirect here, the useEffect will handle it
      } catch (dbError) {
          const permissionError = new FirestorePermissionError({
              path: userDocRef.path,
              operation: docSnap.exists() ? 'get' : 'create',
          });
          errorEmitter.emit('permission-error', permissionError);
          throw dbError; // Propagate error
      }
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && !(error instanceof FirestorePermissionError)) {
            toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
        }
        // If it's a FirestorePermissionError, the listener will handle it.
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
    const userDocRef = doc(db, 'users', user.uid);
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("Dokumen pengguna tidak ditemukan.");
            }
            const currentCredits = userDoc.data().credits ?? 0;
            const newCredits = currentCredits + amount;
            transaction.update(userDocRef, { credits: newCredits });
            setCredits(newCredits);
        });
    } catch (error: any) {
         const permissionError = new FirestorePermissionError({
             path: userDocRef.path,
             operation: 'update',
             requestResourceData: { credits: `current_credits + ${amount}` }, 
         });
         errorEmitter.emit('permission-error', permissionError);
         throw error;
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
