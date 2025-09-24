'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface GeneratedContent {
  id: string;
  timestamp: number;
  productImage: string;
  productDescription: string;
  generatedCaptions: string[];
  generatedFlyer: string;
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
  addToHistory: (content: Omit<GeneratedContent, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [history, setHistory] = useState<GeneratedContent[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHistory = localStorage.getItem('brosurAIGallery');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    }
  }, []);

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
  
  const addToHistory = (content: Omit<GeneratedContent, 'id' | 'timestamp'>) => {
    const newContent: GeneratedContent = {
      ...content,
      id: new Date().toISOString(),
      timestamp: Date.now(),
    };
    setHistory(prevHistory => {
      const updatedHistory = [newContent, ...prevHistory];
      if (typeof window !== 'undefined') {
        localStorage.setItem('brosurAIGallery', JSON.stringify(updatedHistory));
      }
      return updatedHistory;
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
    addToHistory,
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
