import { useDatabaseStatus } from '@/core/database/DatabaseProvider';

export function useDatabase() {
  return useDatabaseStatus();
}
