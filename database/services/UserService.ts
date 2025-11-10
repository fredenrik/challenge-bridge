import { userRepository } from '../repositories';
import { User } from '@/types/entities';

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return await userRepository.findAll();
  }

  async authenticateUser(userId: string): Promise<User | null> {
    const user = await userRepository.findById(userId);

    if (!user) {
      return null;
    }

    return user;
  }

  async getUserById(userId: string): Promise<User | null> {
    return await userRepository.findById(userId);
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    return await userRepository.findByIds(userIds);
  }
}

export const userService = new UserService();
