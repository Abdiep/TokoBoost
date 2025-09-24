'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface GeneratedContent {
  id: string;
  productImage: string;
  productDescription: string;
  generatedCaptions: string[];
  generatedFlyer: string;
  timestamp: number;
}


interface AppContextType {
  isLoggedIn: boolean;
  credits: number;
  login: (email: string) => void;
  logout: () => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  userEmail: string | null;
  history: GeneratedContent[];
  addHistory: (item: GeneratedContent) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<GeneratedContent[]>([]);

  useEffect(() => {
    try {
      const storedEmail = localStorage.getItem('userEmail');
      const storedCredits = localStorage.getItem('userCredits');
      const storedHistory = localStorage.getItem('generationHistory');
      
      if (storedEmail && storedCredits) {
        setUserEmail(storedEmail);
        setCredits(parseInt(storedCredits, 10));
        setIsLoggedIn(true);
      }
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
      setHistory([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    try {
      if (!isLoading) {
        if (isLoggedIn && userEmail) {
          localStorage.setItem('userEmail', userEmail);
          localStorage.setItem('userCredits', credits.toString());
          localStorage.setItem('generationHistory', JSON.stringify(history));
        } else {
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userCredits');
          localStorage.removeItem('generationHistory');
        }
      }
    } catch (error) {
      console.error("Failed to write to localStorage", error);
    }
  }, [isLoggedIn, userEmail, credits, history, isLoading]);


  const login = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setCredits(10); 
    setHistory([]);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserEmail(null);
    setCredits(0);
    setHistory([]);
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

  const addHistory = (item: GeneratedContent) => {
    setHistory((prev) => {
      const newHistory = [item, ...prev];
      if (newHistory.length > 2) {
        return newHistory.slice(0, 2);
      }
      return newHistory;
    });
  };

  const value = {
    isLoggedIn,
    credits,
    login,
    logout,
    deductCredits,
    addCredits,
    userEmail,
    history,
    addHistory
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
