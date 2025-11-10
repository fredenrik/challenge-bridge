export type MessageType = 'text' | 'image';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  type?: MessageType;
  mediaUri?: string;
  thumbnailUri?: string;
  mediaSize?: number;
}
