export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface Message {
  id: number;
  userName: string;
  channelId: number;
  text: string;
  timestamp: Date ;
  avatar: string;
}

export interface Channel {
  id: number;
  name: string;
  users: string[];
  owner: string;
  type: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}
