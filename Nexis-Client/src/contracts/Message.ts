import { User } from './Auth'

export type RawMessage = string;

export interface SerializedMessage {
  user_id: number;
  content: string;
  channelId: number;
  createdAt: string;
  updatedAt: string;
  id: number;
  author: User;
}
