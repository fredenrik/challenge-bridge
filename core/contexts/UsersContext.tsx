import React, { createContext, useContext, ReactNode } from 'react';
import { useUser, User } from '@/core/hooks/useUser';

type UsersContextType = {
  users: User[];
  loading: boolean;
};

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const { users, loading } = useUser();

  const value = {
    users,
    loading,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
}
