import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/core/database/services';
import { Chat, Message, MessageType } from '@/types/entities';

export { Chat, Message };

/**
 * Hook for chat state management
 * Handles UI state only, delegates data operations to ChatService
 */
export function useChats(currentUserId: string | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  // Load chats for the current user
  useEffect(() => {
    const loadChats = async () => {
      if (!currentUserId) {
        setChats([]);
        setLoading(false);
        return;
      }

      try {
        const userChats = await chatService.getUserChats(currentUserId);
        setChats(userChats);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [currentUserId]);

  const createChat = useCallback(async (participantIds: string[]): Promise<Chat | null> => {
    if (!currentUserId) {
      return null;
    }

    try {
      const newChat = await chatService.createChat(participantIds, currentUserId);

      if (newChat) {
        setChats(prevChats => [...prevChats, newChat]);
      }

      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }, [currentUserId]);

  const sendMessage = useCallback(async (
    chatId: string,
    text: string,
    senderId: string,
    options?: {
      type?: MessageType;
      mediaUri?: string;
      thumbnailUri?: string;
      mediaSize?: number;
    }
  ): Promise<boolean> => {
    try {
      const newMessage = await chatService.sendMessage(chatId, senderId, text, options);

      if (!newMessage) {
        return false;
      }

      // Update local state with optimistic UI update
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage,
            };
          }
          return chat;
        });
      });

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  return {
    chats,
    createChat,
    sendMessage,
    loading,
  };
}
