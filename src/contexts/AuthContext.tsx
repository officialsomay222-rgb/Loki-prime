import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';

export interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  user: User | null;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const continueAsGuest = () => {
    setIsGuest(true);
    setIsLoggedIn(true);
  };

  const signIn = async () => {
    setIsLoggedIn(true);
  };

  const signOut = async () => {
    setIsLoggedIn(true);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isGuest, signIn, signOut, continueAsGuest, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

