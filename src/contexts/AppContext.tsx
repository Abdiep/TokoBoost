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
import { ref, onValue, set, get } from 'firebase/database';
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
        // Listener ini hanya bertugas membaca dan mengupdate UI.
        // Logika pemberian kredit awal sudah dipindah ke fungsi login/register.
        if (creditsVal !== null) {
          setCredits(creditsVal);
        } else {
          // Jika karena suatu alasan data belum ada, set UI ke 0 sementara
          // proses login/register di latar belakang seharusnya sudah membuat datanya.
          setCredits(0);
        }
      }, (error) => {
        console.error("Firebase onValue error:", error);
        toast({ title: "Error", description: "Gagal memuat data kredit.", variant: "destructive" });
        setCredits(0);
      });

      // Cleanup the listener when the user logs out or the component unmounts.
      return () => unsubscribeDb();
    } else {
      // Jika tidak ada user, reset kredit
      setCredits(0);
    }
  }, [user, toast]);


  const loginWithEmail = async (email: string, pass: string) => {
    try {
      // 1. Coba login terlebih dahulu
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        // 2. Jika login gagal karena user tidak ada, buat akun baru
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') { // invalid-credential juga bisa berarti user tidak ada
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const newUser = userCredential.user;
            // 3. Langsung buat entri database dengan 10 kredit untuk pengguna baru
            await set(ref(db, `users/${newUser.uid}/credits`), 10);
          } catch (creationError: any) {
             if (creationError.code === 'auth/email-already-in-use') {
                toast({ title: "Login Gagal", description: 'Email sudah terdaftar dengan metode lain (misal: Google). Silakan masuk menggunakan metode tersebut.', variant: "destructive" });
             } else {
                toast({ title: "Pendaftaran Gagal", description: creationError.message, variant: "destructive" });
             }
             throw creationError; // Lemparkan error agar tidak dianggap login berhasil
          }
        } else {
            toast({ title: "Login Gagal", description: error.message, variant: "destructive" });
            throw error; // Lemparkan error agar tidak dianggap login berhasil
        }
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // Cek apakah pengguna ini sudah ada di database kita
      const userRef = ref(db, `users/${googleUser.uid}/credits`);
      const snapshot = await get(userRef);

      // Jika tidak ada (login pertama kali via Google), beri 10 kredit
      if (!snapshot.exists()) {
        await set(userRef, 10);
      }
    } catch (error: any) {
        toast({ title: "Google Login Gagal", description: error.message, variant: "destructive" });
        throw error; // Lemparkan error
    }
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
  
  // Jangan render apapun sampai status otentikasi selesai dicek
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
