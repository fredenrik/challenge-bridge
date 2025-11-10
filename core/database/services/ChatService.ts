import { chatRepository } from '../repositories';
import { Chat, Message, MessageType } from '@/types/entities';
import { PaginatedResult, PaginationOptions } from '@/types/Pagination';

/**
 * Service layer for Chat business logic
 * Uses optimized repository methods to avoid N+1 queries
 */
export class ChatService {
  /**
   * Get all chats for a user
   * Uses optimized batch loading (3 queries instead of 3N+1)
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    return await chatRepository.findChatsByUserIdOptimized(userId);
  }

  async getChatById(chatId: string): Promise<Chat | null> {
    return await chatRepository.findChatById(chatId);
  }

  async createChat(participantIds: string[], currentUserId: string): Promise<Chat | null> {

    if (!participantIds.includes(currentUserId)) {
      console.warn('Cannot create chat: current user must be a participant');
      return null;
    }

    if (participantIds.length < 2) {
      console.warn('Cannot create chat: at least 2 participants required');
      return null;
    }

    return await chatRepository.createChat(participantIds);
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    text: string,
    options?: {
      type?: MessageType;
      mediaUri?: string;
      thumbnailUri?: string;
      mediaSize?: number;
    }
  ): Promise<Message | null> {
    // For text messages, validate text
    if (options?.type !== 'image') {
      const trimmedText = text.trim();
      if (!trimmedText) {
        console.warn('Cannot send empty message');
        return null;
      }
    }

    return await chatRepository.createMessage(chatId, senderId, text, options);
  }

  /**
   * @deprecated Use getChatMessagesPaginated for better performance
   */
  async getChatMessages(chatId: string): Promise<Message[]> {
    return await chatRepository.findMessagesByChatId(chatId);
  }

  /**
   * Get paginated messages for a chat
   * Uses cursor-based pagination for efficient loading
   */
  async getChatMessagesPaginated(
    chatId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Message>> {
    return await chatRepository.findMessagesPaginated(chatId, options);
  }

  /**
   * Load older messages (for infinite scroll)
   */
  async loadOlderMessages(
    chatId: string,
    beforeTimestamp: number,
    limit?: number
  ): Promise<PaginatedResult<Message>> {
    return await chatRepository.findMessagesPaginated(chatId, {
      limit: limit || 50,
      beforeTimestamp,
    });
  }

  async getChatParticipants(chatId: string): Promise<string[]> {
    return await chatRepository.findParticipantsByChatId(chatId);
  }
}

export const chatService = new ChatService();
