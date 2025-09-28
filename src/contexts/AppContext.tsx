
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AppContextType {
  isLoggedIn: boolean;
  credits: number;
  login: (email: string) => void;
  logout: () => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  userEmail: string | null;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        const storedCredits = localStorage.getItem(`credits_${storedEmail}`);
        login(storedEmail, storedCredits !== null ? parseInt(storedCredits, 10) : 10);
      }
    } catch (e) {
      console.error('Failed to access localStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, initialCredits: number = 10) => {
    try {
      localStorage.setItem('userEmail', email);
      const storedCredits = localStorage.getItem(`credits_${email}`);
      // Only give 10 credits if the user is new (no credits stored)
      const finalCredits = storedCredits !== null ? parseInt(storedCredits, 10) : initialCredits;
      
      setIsLoggedIn(true);
      setUserEmail(email);
      setCredits(finalCredits);
      localStorage.setItem(`credits_${email}`, String(finalCredits));

    } catch (e) {
      console.error('Failed to access localStorage', e);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('userEmail');
    } catch(e) {
      console.error('Failed to access localStorage', e);
    }
    setIsLoggedIn(false);
    setUserEmail(null);
    setCredits(0);
  };

  const deductCredits = (amount: number) => {
    if (credits >= amount) {
      const newCredits = credits - amount;
      setCredits(newCredits);
      if (userEmail) {
        try {
          localStorage.setItem(`credits_${userEmail}`, String(newCredits));
        } catch(e) {
          console.error('Failed to access localStorage', e);
        }
      }
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    const newCredits = credits + amount;
    setCredits(newCredits);
    if (userEmail) {
      try {
        localStorage.setItem(`credits_${userEmail}`, String(newCredits));
      } catch(e) {
        console.error('Failed to access localStorage', e);
      }
    }
  };

  const value = {
    isLoggedIn,
    credits,
    login,
    logout,
    deductCredits,
    addCredits,
    userEmail,
    isLoading,
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
