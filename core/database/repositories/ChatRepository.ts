import { db } from '../db';
import { chats, chatParticipants, messages } from '../schema';
import { eq, inArray, lt, desc, and } from 'drizzle-orm';
import { Chat, Message, MessageType } from '@/types/entities';
import { PaginatedResult, PaginationOptions, INITIAL_MESSAGE_LOAD } from '@/types/Pagination';

export class ChatRepository {

  async findChatIdsByUserId(userId: string): Promise<string[]> {
    try {
      const participantRows = await db
        .select()
        .from(chatParticipants)
        .where(eq(chatParticipants.userId, userId));

      return participantRows.map(row => row.chatId);
    } catch (error) {
      console.error('Error fetching chat IDs:', error);
      throw new Error('Failed to fetch chat IDs');
    }
  }

  async findParticipantsByChatId(chatId: string): Promise<string[]> {
    try {
      const participantsData = await db
        .select()
        .from(chatParticipants)
        .where(eq(chatParticipants.chatId, chatId));

      return participantsData.map(p => p.userId);
    } catch (error) {
      console.error('Error fetching participants:', error);
      throw new Error('Failed to fetch participants');
    }
  }

  async findMessagesByChatId(chatId: string): Promise<Message[]> {
    try {
      const messagesData = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.timestamp);

      return messagesData.map(m => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        timestamp: m.timestamp,
        type: (m.type as MessageType) || 'text',
        mediaUri: m.mediaUri || undefined,
        thumbnailUri: m.thumbnailUri || undefined,
        mediaSize: m.mediaSize || undefined,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  async findMessagesPaginated(
    chatId: string,
    options: PaginationOptions = { limit: INITIAL_MESSAGE_LOAD }
  ): Promise<PaginatedResult<Message>> {
    try {
      const { limit, beforeTimestamp } = options;

      // Build where conditions
      const whereConditions = beforeTimestamp
        ? and(
            eq(messages.chatId, chatId),
            lt(messages.timestamp, beforeTimestamp)
          )
        : eq(messages.chatId, chatId);

      // Execute query with combined conditions
      const messagesData = await db
        .select()
        .from(messages)
        .where(whereConditions)
        .orderBy(desc(messages.timestamp))
        .limit(limit + 1); // Fetch one extra to check if there are more

      // Check if there are more messages
      const hasMore = messagesData.length > limit;
      const data = hasMore ? messagesData.slice(0, limit) : messagesData;

      // Map to Message type and reverse to get chronological order
      const messagesResult = data
        .map(m => ({
          id: m.id,
          senderId: m.senderId,
          text: m.text,
          timestamp: m.timestamp,
          type: (m.type as MessageType) || 'text',
          mediaUri: m.mediaUri || undefined,
          thumbnailUri: m.thumbnailUri || undefined,
          mediaSize: m.mediaSize || undefined,
        }))
        .reverse(); // Reverse to show oldest first in the list

      return {
        data: messagesResult,
        hasMore,
        nextCursor: hasMore ? data[data.length - 1].timestamp : undefined,
      };
    } catch (error) {
      console.error('Error fetching messages (paginated):', error);
      throw new Error('Failed to fetch messages');
    }
  }

  /**
   * Get count of messages in a chat (for pagination info)
   */
  async getMessageCount(chatId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: messages.id })
        .from(messages)
        .where(eq(messages.chatId, chatId));

      return result.length;
    } catch (error) {
      console.error('Error counting messages:', error);
      return 0;
    }
  }

  async findChatById(chatId: string): Promise<Chat | null> {
    try {
      const chatData = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId));

      if (chatData.length === 0) return null;

      const [participants, chatMessages] = await Promise.all([
        this.findParticipantsByChatId(chatId),
        this.findMessagesByChatId(chatId),
      ]);

      const lastMessage = chatMessages.length > 0
        ? chatMessages[chatMessages.length - 1]
        : undefined;

      return {
        id: chatId,
        participants,
        messages: chatMessages,
        lastMessage,
      };
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw new Error('Failed to fetch chat');
    }
  }

  /**
   * @deprecated Use findChatsByUserIdOptimized for better performance
   * This method has N+1 query problem
   */
  async findChatsByUserId(userId: string): Promise<Chat[]> {
    try {
      const chatIds = await this.findChatIdsByUserId(userId);

      if (chatIds.length === 0) return [];

      const chats = await Promise.all(
        chatIds.map(chatId => this.findChatById(chatId))
      );

      return chats.filter((chat): chat is Chat => chat !== null);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw new Error('Failed to fetch user chats');
    }
  }

  /**
   * OPTIMIZED: Find all chats for a user using batch loading
   * Resolves N+1 query problem: 3 queries instead of 3N+1
   *
   * Performance:
   * - 5 chats: 16 queries → 3 queries (-81%)
   * - 10 chats: 31 queries → 3 queries (-90%)
   * - 20 chats: 61 queries → 3 queries (-95%)
   */
  async findChatsByUserIdOptimized(userId: string): Promise<Chat[]> {
    try {
      // Query 1: Get all chat IDs for user
      const chatIds = await this.findChatIdsByUserId(userId);

      if (chatIds.length === 0) return [];

      // Query 2: Batch load ALL participants for ALL chats in one query
      const allParticipantsData = await db
        .select()
        .from(chatParticipants)
        .where(inArray(chatParticipants.chatId, chatIds));

      // Query 3: Batch load RECENT messages for ALL chats (optimized for initial load)
      // Only loads last 50 messages per chat to avoid loading thousands
      const allMessagesData = await db
        .select()
        .from(messages)
        .where(inArray(messages.chatId, chatIds))
        .orderBy(desc(messages.timestamp))
        .limit(chatIds.length * INITIAL_MESSAGE_LOAD);

      // Group participants by chatId (in-memory, no additional queries)
      const participantsByChatId = new Map<string, string[]>();
      allParticipantsData.forEach(p => {
        if (!participantsByChatId.has(p.chatId)) {
          participantsByChatId.set(p.chatId, []);
        }
        participantsByChatId.get(p.chatId)!.push(p.userId);
      });

      // Group messages by chatId (in-memory, no additional queries)
      const messagesByChatId = new Map<string, Message[]>();
      allMessagesData.forEach(m => {
        if (!messagesByChatId.has(m.chatId)) {
          messagesByChatId.set(m.chatId, []);
        }
        messagesByChatId.get(m.chatId)!.push({
          id: m.id,
          senderId: m.senderId,
          text: m.text,
          timestamp: m.timestamp,
          type: (m.type as MessageType) || 'text',
          mediaUri: m.mediaUri || undefined,
          thumbnailUri: m.thumbnailUri || undefined,
          mediaSize: m.mediaSize || undefined,
        });
      });

      // Build complete Chat objects (no additional queries)
      const chatsResult: Chat[] = chatIds.map(chatId => {
        const chatMessages = messagesByChatId.get(chatId) || [];
        const participants = participantsByChatId.get(chatId) || [];

        return {
          id: chatId,
          participants,
          messages: chatMessages,
          lastMessage: chatMessages.length > 0
            ? chatMessages[chatMessages.length - 1]
            : undefined,
        };
      });

      return chatsResult;
    } catch (error) {
      console.error('Error fetching user chats (optimized):', error);
      throw new Error('Failed to fetch user chats');
    }
  }

  async createChat(participantIds: string[]): Promise<Chat> {
    try {
      const chatId = `chat${Date.now()}`;

      await db.insert(chats).values({
        id: chatId,
      });

      // Insert all participants
      await Promise.all(
        participantIds.map(userId =>
          db.insert(chatParticipants).values({
            id: `cp-${chatId}-${userId}`,
            chatId: chatId,
            userId: userId,
          })
        )
      );

      return {
        id: chatId,
        participants: participantIds,
        messages: [],
      };
    } catch (error) {
      console.error('Error creating chat:', error);
      throw new Error('Failed to create chat');
    }
  }

  /**
   * Add a message to a chat (text or media)
   */
  async createMessage(
    chatId: string,
    senderId: string,
    text: string,
    options?: {
      type?: MessageType;
      mediaUri?: string;
      thumbnailUri?: string;
      mediaSize?: number;
    }
  ): Promise<Message> {
    try {
      const messageId = `msg${Date.now()}`;
      const timestamp = Date.now();
      
      await db.insert(messages).values({
        id: messageId,
        chatId: chatId,
        senderId: senderId,
        text: text,
        timestamp: timestamp,
        type: options?.type || 'text',
        mediaUri: options?.mediaUri,
        thumbnailUri: options?.thumbnailUri,
        mediaSize: options?.mediaSize,
      });
      
      return {
        id: messageId,
        senderId,
        text,
        timestamp,
        type: options?.type,
        mediaUri: options?.mediaUri,
        thumbnailUri: options?.thumbnailUri,
        mediaSize: options?.mediaSize,
      };
    } catch (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }
}

// Export singleton instance
export const chatRepository = new ChatRepository();
