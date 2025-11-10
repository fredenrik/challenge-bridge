import React, { ReactNode } from 'react';
import { DatabaseProvider } from '../database/DatabaseProvider';
import { AuthProvider, ChatsProvider, UsersProvider } from './contexts';

/**
 * Main application provider that composes all context providers
 * Contexts are separated by domain to prevent unnecessary re-renders
 * 
 * Structure:
 * - DatabaseProvider: Database initialization
 * - AuthProvider: Authentication state (login, logout, currentUser)
 * - UsersProvider: Users list (all users in system)
 * - ChatsProvider: Chats and messages (depends on AuthProvider)
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <UsersProvider>
          <ChatsProvider>
            {children}
          </ChatsProvider>
        </UsersProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}

// Re-export context hooks for convenience
export { useAuth } from './contexts/AuthContext';
export { useUsers } from './contexts/UsersContext';
export { useChatsContext } from './contexts/ChatsContext';

// Export types
export type { User } from './useUser';
export type { Chat, Message } from './useChats';
