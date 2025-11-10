
export interface PaginationOptions {
  limit: number;
  offset?: number;
  beforeTimestamp?: number; // For cursor-based pagination
}


export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
  nextCursor?: number;
}

// export const DEFAULT_PAGE_SIZE = 50;
export const INITIAL_MESSAGE_LOAD = 50;
