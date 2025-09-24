'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  const login = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setCredits(10); // Initial credits for new login
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
