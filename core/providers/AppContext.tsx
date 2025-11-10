import React, { ReactNode } from 'react';
import { DatabaseProvider } from '@/core/database/DatabaseProvider';
import { AuthProvider, ChatsProvider, UsersProvider } from '@/core/contexts';

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

export { useAuth } from '@/core/contexts/AuthContext';
export { useUsers } from '@/core/contexts/UsersContext';
export { useChatsContext } from '@/core/contexts/ChatsContext';

export type { User } from '@/core/hooks/useUser';
export type { Chat, Message } from '@/core/hooks/useChats';
