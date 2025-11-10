import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
});

export const chatParticipants = sqliteTable("chat_participants", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().references(() => chats.id),
  userId: text("user_id").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().references(() => chats.id),
  senderId: text("sender_id").notNull(),
  text: text("text").notNull(),
  timestamp: integer("timestamp").notNull(),
  type: text("type").default("text"), // 'text' | 'image'
  mediaUri: text("media_uri"), // Full resolution image URI/base64
  thumbnailUri: text("thumbnail_uri"), // Compressed thumbnail
  mediaSize: integer("media_size"), // Size in bytes
});
