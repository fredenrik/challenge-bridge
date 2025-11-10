import React, { createContext, useContext, ReactNode } from 'react';
import { useChats, Chat } from '@/core/hooks/useChats';
import { useAuth } from './AuthContext';
import {MessageType} from '@/types/entities';

type ChatsContextType = {
  chats: Chat[];
  createChat: (participantIds: string[]) => Promise<Chat | null>;
  sendMessage: (chatId: string, text: string, senderId: string, options?: {
    type?: MessageType;
    mediaUri?: string;
    thumbnailUri?: string;
    mediaSize?: number;
  }) => Promise<boolean>;
  loading: boolean;
};

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

export function ChatsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { chats, createChat, sendMessage, loading } = useChats(currentUser?.id || null);

  const value = {
    chats,
    createChat,
    sendMessage,
    loading,
  };

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

export function useChatsContext() {
  const context = useContext(ChatsContext);
  if (context === undefined) {
    throw new Error('useChatsContext must be used within a ChatsProvider');
  }
  return context;
}
