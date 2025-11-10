import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  status: text("status", { enum: ["online", "offline", "away"] }).notNull(),
}); 