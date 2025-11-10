import { db } from '../db';
import { chats, chatParticipants, messages } from '../schema';
import { eq, inArray } from 'drizzle-orm';
import { Chat, Message } from '@/types/entities';

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
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
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

      // Query 3: Batch load ALL messages for ALL chats in one query
      const allMessagesData = await db
        .select()
        .from(messages)
        .where(inArray(messages.chatId, chatIds))
        .orderBy(messages.timestamp);

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
   * Add a message to a chat
   */
  async createMessage(chatId: string, senderId: string, text: string): Promise<Message> {
    try {
      const messageId = `msg${Date.now()}`;
      const timestamp = Date.now();

      await db.insert(messages).values({
        id: messageId,
        chatId: chatId,
        senderId: senderId,
        text: text,
        timestamp: timestamp,
      });

      return {
        id: messageId,
        senderId,
        text,
        timestamp,
      };
    } catch (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }
}

// Export singleton instance
export const chatRepository = new ChatRepository();
