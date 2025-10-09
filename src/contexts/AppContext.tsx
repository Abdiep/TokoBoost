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

interface AppContextType {
  isLoggedIn: boolean;
  user: User | null;
  credits: number;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
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
  const db = getFirestore(); // Inisialisasi firestore

  useEffect(() => {
    let unsubscribeDb: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
  
      if (unsubscribeDb) {
        unsubscribeDb();
      }
  
      if (currentUser) {
        // Beralih ke Firestore untuk mendengarkan perubahan kredit
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubscribeDb = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setCredits(docSnap.data().credits ?? 0);
          } else {
             console.log("User document not found in Firestore for credit listening.");
             setCredits(0);
          }
        }, (error) => {
           console.error("Error listening to credit changes:", error);
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
  }, [db]);
  
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

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userDocRef = doc(db, 'users', googleUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          displayName: googleUser.displayName,
          email: googleUser.email,
          credits: 10,
          createdAt: new Date().toISOString(),
        });
        toast({ title: 'Login Berhasil', description: 'Selamat datang! Anda mendapat 10 kredit gratis.' });
      } else {
        toast({ title: 'Login Berhasil', description: 'Selamat datang kembali!' });
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
  
  const addCredits = (amount: number) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw "User document does not exist!";
        }
        const newCredits = (userDoc.data().credits || 0) + amount;
        transaction.update(userDocRef, { credits: newCredits });
      }).catch((error) => {
        console.error("Gagal menambahkan kredit:", error);
        toast({ title: "Update Kredit Gagal", description: "Gagal memperbarui saldo kredit di database.", variant: "destructive" });
      });
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
