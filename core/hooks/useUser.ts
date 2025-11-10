import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/core/database/services';
import { User } from '@/types/entities';

export { User };

/**
 * Hook for user state management
 * Handles UI state only, delegates data operations to UserService
 */
export function useUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const login = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const user = await userService.authenticateUser(userId);

      if (user) {
        setCurrentUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return {
    users,
    currentUser,
    login,
    logout,
    isLoggedIn: !!currentUser,
    loading,
  };
}
