import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, User } from '@/core/hooks/useUser';

type AuthContextType = {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (userId: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { currentUser, login, logout, isLoggedIn, loading } = useUser();

  const value = {
    currentUser,
    isLoggedIn,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
