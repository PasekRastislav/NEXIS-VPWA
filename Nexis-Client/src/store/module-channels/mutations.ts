import { SerializedMessage } from 'src/contracts'
import { MutationTree } from 'vuex'
import { ChannelsStateInterface } from './state'

const mutation: MutationTree<ChannelsStateInterface> = {
  LOADING_START (state) {
    state.loading = true
    state.error = null
  },
  LOADING_SUCCESS (state, { channel, messages }: { channel: string, messages: SerializedMessage[] }) {
    state.loading = false
    state.messages[channel] = messages
  },
  LOADING_ERROR (state, error) {
    state.loading = false
    state.error = error
  },
  CLEAR_CHANNEL (state, channel) {
    state.active = null
    delete state.messages[channel]
  },
  DELETE_CHANNEL (state, channelName: string) {
    console.log(`Deleting channel: ${channelName}`)
    delete state.messages[channelName]
    delete state.isPrivate[channelName]
    delete state.adminStatus[channelName]

    if (!state.deleted) {
      state.deleted = {}
    }

    state.deleted[channelName] = true

    // Reset active channel if it is the deleted one
    if (state.active === channelName) {
      state.active = null
    }
  },
  SET_ACTIVE (state, channel: string) {
    state.active = channel
  },
  NEW_MESSAGE (state, { channel, message }: { channel: string, message: SerializedMessage }) {
    state.messages[channel].push(message)
    if (channel !== state.active) {
      state.notification = {
        channel,
        message
      }
    }
  },
  SET_USERS (state, { channel, users }) {
    if (!state.users) {
      state.users = {}
    }
    state.users[channel] = users
    console.log('SET_USERS Mutation:', channel, users)
  },
  SET_ADMIN_STATUS (state, { channel, isAdmin }) {
    if (!state.adminStatus) {
      state.adminStatus = {}
    }
    state.adminStatus[channel] = isAdmin
  },
  SET_JOINED_CHANNELS (state, channels: { id: number, name: string, isPrivate: boolean }[]) {
    channels.forEach(channel => {
      if (!state.messages[channel.name]) {
        state.messages[channel.name] = []
      }
      if (!state.isPrivate) {
        state.isPrivate = {}
      }
      state.isPrivate[channel.name] = channel.isPrivate
    })
  },
  REMOVE_JOINED_CHANNEL (state, channelName: string) {
    // Remove the channel from joinedChannels and its related data
    delete state.messages[channelName]
    delete state.isPrivate[channelName]
    delete state.users[channelName]
    if (state.active === channelName) {
      state.active = null
    }
  },
  SET_TYPING (state, { channel, userId, userName, text }) {
    if (!state.typingUsers) state.typingUsers = {}
    if (!state.typingUsers[channel]) state.typingUsers[channel] = {}
    state.typingUsers[channel][userId] = { userName, text }
  },
  CLEAR_TYPING (state, { channel, userId }) {
    if (state.typingUsers && state.typingUsers[channel] && state.typingUsers[channel][userId]) {
      delete state.typingUsers[channel][userId]
    }
  }

}

export default mutation
