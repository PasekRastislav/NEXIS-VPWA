import { SerializedMessage, User } from 'src/contracts'

export interface ChannelsStateInterface {
  loading: boolean,
  error: Error | null,
  messages: { [channel: string]: SerializedMessage[] }
  isPrivate: { [channel: string]: boolean },
  active: string | null,
  adminStatus: { [channel: string]: boolean },
  deleted?: { [channel: string]: boolean },
  users: { [channel: string]: User[] },
  notification: { channel: string, message: SerializedMessage } | null,
  joinedChannels: { id: number; name: string; isPrivate: boolean; isBanned: boolean }[],
  typingUsers?: { [channel: string]: { [userId: string]: { userName: string; text: string } } },
  highlightedChannel?: string | null
}

function state (): ChannelsStateInterface {
  return {
    loading: false,
    error: null,
    messages: {},
    active: null,
    isPrivate: {},
    adminStatus: {},
    deleted: {},
    users: {},
    notification: null,
    joinedChannels: [],
    typingUsers: {},
    highlightedChannel: null
  }
}

export default state
