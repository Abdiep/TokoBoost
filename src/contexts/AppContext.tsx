'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface GeneratedContent {
  id: string;
  productImage?: string; // Original image, not stored in history
  productDescription: string;
  generatedCaptions: string[];
  generatedFlyer: string; // Flyer image data URI, for current session only
  timestamp: number;
}

// This is what's stored in localStorage. No image data.
export interface HistoryItem {
    id: string;
    productDescription: string;
    generatedCaptions: string[];
    timestamp: number;
    generatedFlyer: string; // Will be an empty string in storage, but can be populated in-memory
}


interface AppContextType {
  isLoggedIn: boolean;
  credits: number;
  login: (email: string) => void;
  logout: () => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  userEmail: string | null;
  history: HistoryItem[];
  addHistory: (item: GeneratedContent) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Effect to load data from localStorage on initial mount
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
        // All items from storage will have generatedFlyer as ""
        setHistory(JSON.parse(storedHistory));
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
      setHistory([]); // Reset on error
    }
    setIsLoading(false);
  }, []);

  // Effect to save non-history data to localStorage
   useEffect(() => {
    try {
      if (!isLoading) {
        if (isLoggedIn && userEmail) {
          localStorage.setItem('userEmail', userEmail);
          localStorage.setItem('userCredits', credits.toString());
        } else {
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userCredits');
          localStorage.removeItem('generationHistory');
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
    setHistory([]);
    localStorage.removeItem('generationHistory');
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
    // Version of the item without any image data for safe storage
    const itemForStorage: HistoryItem = {
      id: item.id,
      productDescription: item.productDescription,
      generatedCaptions: item.generatedCaptions,
      timestamp: item.timestamp,
      generatedFlyer: "", // Never store flyer data URL in localStorage
    };

    setHistory((prev) => {
      // The new history for the UI state includes the full item with the flyer for immediate download
      const newHistoryInMemory: HistoryItem[] = [item, ...prev];
      if (newHistoryInMemory.length > 2) {
        newHistoryInMemory.pop();
      }

      // The new history for localStorage only contains the text-based data
      const currentStorageHistory: HistoryItem[] = prev.map(p => ({ ...p, generatedFlyer: "" }));
      const newHistoryForStorage = [itemForStorage, ...currentStorageHistory];
       if (newHistoryForStorage.length > 2) {
        newHistoryForStorage.pop();
      }
      
      try {
        localStorage.setItem('generationHistory', JSON.stringify(newHistoryForStorage));
      } catch (e) {
        console.error("Failed to save history to localStorage", e);
      }
      
      // Return the in-memory version for the UI to use immediately
      return newHistoryInMemory;
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
