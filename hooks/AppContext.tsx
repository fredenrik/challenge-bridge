import React, { ReactNode } from 'react';
import { DatabaseProvider } from '@/database/DatabaseProvider';
import { AuthProvider, ChatsProvider, UsersProvider } from '@/contexts';

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

export { useAuth } from '@/contexts/AuthContext';
export { useUsers } from '@/contexts/UsersContext';
export { useChatsContext } from '@/contexts/ChatsContext';

export type { User } from './useUser';
export type { Chat, Message } from './useChats';
