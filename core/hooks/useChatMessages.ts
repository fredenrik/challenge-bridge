import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/core/database/services';
import { Message } from '@/types/entities';

interface UseChatMessagesResult {
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadOlderMessages: () => Promise<void>;
  refresh: () => Promise<void>;
  addNewMessage: (message: Message) => void;
}

export function useChatMessages(chatId: string | null): UseChatMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | undefined>();

  const loadInitialMessages = useCallback(async () => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await chatService.getChatMessagesPaginated(chatId);

      setMessages(result.data);
      setHasMore(result.hasMore);
      setOldestTimestamp(
        result.data.length > 0
          ? result.data[0].timestamp // First message (oldest in current page)
          : undefined
      );
    } catch (error) {
      console.error('Error loading initial messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Load older messages
  const loadOlderMessages = useCallback(async () => {
    if (!chatId || !hasMore || loadingMore || !oldestTimestamp) {
      return;
    }

    try {
      setLoadingMore(true);

      const result = await chatService.loadOlderMessages(
        chatId,
        oldestTimestamp
      );

      if (result.data.length > 0) {
        setMessages(prev => [...result.data, ...prev]);
        setHasMore(result.hasMore);
        setOldestTimestamp(result.data[0].timestamp);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, hasMore, loadingMore, oldestTimestamp]);

  const refresh = useCallback(async () => {
    await loadInitialMessages();
  }, [loadInitialMessages]);

  const addNewMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadOlderMessages,
    refresh,
    addNewMessage,
  };
}
