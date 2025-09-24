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
      const storedCredits = localStorage.getItem('userCredits');
      if (storedEmail && storedCredits) {
        setUserEmail(storedEmail);
        setCredits(parseInt(storedCredits, 10));
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    try {
      if (!isLoading) {
        if (isLoggedIn && userEmail) {
          localStorage.setItem('userEmail', userEmail);
          localStorage.setItem('userCredits', credits.toString());
        } else {
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userCredits');
        }
      }
    } catch (error) {
      console.error("Failed to write to localStorage", error);
    }
  }, [isLoggedIn, userEmail, credits, isLoading]);


  const login = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setCredits(10); 
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserEmail(null);
    setCredits(0);
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
    isLoggedIn,
    credits,
    login,
    logout,
    deductCredits,
    addCredits,
    userEmail,
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
