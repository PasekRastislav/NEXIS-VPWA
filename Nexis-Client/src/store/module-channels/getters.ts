import { GetterTree } from 'vuex'
import { StateInterface } from '../index'
import { ChannelsStateInterface } from './state'

const getters: GetterTree<ChannelsStateInterface, StateInterface> = {
  joinedChannels (context) {
    console.log('Joined channels blazen:', Object.keys(context.messages))
    return Object.keys(context.messages)
  },
  currentMessages (context) {
    return context.active !== null ? context.messages[context.active] : []
  },
  lastMessageOf (context) {
    return (channel: string) => {
      const messages = context.messages[channel]
      return messages.length > 0 ? messages[messages.length - 1] : null
    }
  },
  isPrivate: (state) => (channelName: string) => {
    return state.isPrivate[channelName]
  },
  getUsersForChannel: (state) => (channel: string) => {
    return state.users[channel] || []
  }
}

export default getters
