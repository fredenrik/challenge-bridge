import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import { User } from '@/types/entities';


export class UserRepository {

  async findAll(): Promise<User[]> {
    try {
      const usersData = await db.select().from(users);
      return usersData;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async findById(userId: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user');
    }
  }

  async findByIds(userIds: string[]): Promise<User[]> {
    try {
      const users = await Promise.all(
        userIds.map(id => this.findById(id))
      );

      return users.filter((user): user is User => user !== null);
    } catch (error) {
      console.error('Error fetching users by IDs:', error);
      throw new Error('Failed to fetch users');
    }
  }
}

export const userRepository = new UserRepository();
