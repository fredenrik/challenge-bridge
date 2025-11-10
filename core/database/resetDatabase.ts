import * as SQLite from 'expo-sqlite';

/**
 * Drops all tables and recreates them with the new schema
 * USE WITH CAUTION: This will delete all data
 */
export async function resetDatabase() {
  const sqlite = SQLite.openDatabaseSync('chat-app.db');
  
  try {
    console.log('Dropping existing tables...');
    
    await sqlite.execAsync('DROP TABLE IF EXISTS messages;');
    await sqlite.execAsync('DROP TABLE IF EXISTS chat_participants;');
    await sqlite.execAsync('DROP TABLE IF EXISTS chats;');
    await sqlite.execAsync('DROP TABLE IF EXISTS users;');
    
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
    
    console.log('Creating messages table with media support...');
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
    
    console.log('Database reset successfully!');
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}
