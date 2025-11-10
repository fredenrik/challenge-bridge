import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

// Open a database connection using the correct async API from Expo SQLite
const sqlite = SQLite.openDatabaseSync('chat-app.db');

// Create the Drizzle client
export const db = drizzle(sqlite, { schema });

// Initialize function to create tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log('Creating users table...');
    await sqlite.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);
    
    console.log('Creating chats table...');
    await sqlite.execAsync(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY
      );
    `);
    
    console.log('Creating chat_participants table...');
    await sqlite.execAsync(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats (id)
      );
    `);
    
    console.log('Creating messages table...');
    await sqlite.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        type TEXT DEFAULT 'text',
        media_uri TEXT,
        thumbnail_uri TEXT,
        media_size INTEGER,
        FOREIGN KEY (chat_id) REFERENCES chats (id)
      );
    `);
    
    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 