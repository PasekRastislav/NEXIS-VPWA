import { SerializedMessage } from 'src/contracts'

export interface ChannelsStateInterface {
  loading: boolean,
  error: Error | null,
  messages: { [channel: string]: SerializedMessage[] }
  isPrivate: { [channel: string]: boolean },
  active: string | null,
  adminStatus: { [channel: string]: boolean },
  deleted?: { [channel: string]: boolean },
}

function state (): ChannelsStateInterface {
  return {
    loading: false,
    error: null,
    messages: {},
    active: null,
    isPrivate: {},
    adminStatus: {},
    deleted: {}
  }
}

export default state
