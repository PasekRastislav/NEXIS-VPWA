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
  NEW_MESSAGE (state, { channel, message }: { channel: string; message: SerializedMessage }) {
    if (!state.messages[channel]) {
      state.messages[channel] = []
    }
    state.messages[channel].push(message)

    // Notify if the channel is not active
    if (channel !== state.active) {
      state.notification = { channel, message }
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
  SET_JOINED_CHANNELS (state, channels: { id: number; name: string; isPrivate: boolean; isBanned: boolean }[]) {
    channels.forEach(channel => {
      if (channel.isBanned) return

      const existingIndex = state.joinedChannels.findIndex(ch => ch.name === channel.name)
      if (existingIndex !== -1) {
        state.joinedChannels.splice(existingIndex, 1)
      }

      state.joinedChannels.unshift({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.isPrivate,
        isBanned: channel.isBanned
      })

      if (!state.messages[channel.name]) {
        state.messages[channel.name] = []
      }
      state.isPrivate[channel.name] = channel.isPrivate
    })
  },
  SET_ACTIVE (state, channelName: string) {
    state.active = channelName
    state.highlightedChannel = channelName

    // Move the active channel to the top of the joinedChannels list
    const channelIndex = state.joinedChannels.findIndex(ch => ch.name === channelName)
    if (channelIndex !== -1) {
      const [activeChannel] = state.joinedChannels.splice(channelIndex, 1) // Remove it
      state.joinedChannels.unshift(activeChannel) // Add it to the top
    }
  },

  HIGHLIGHT_CHANNEL (state, channelName: string) {
    state.highlightedChannel = channelName
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
  },
  INIT_BUFFER (state, channel: string) {
    if (!state.bufferedMessages[channel]) {
      state.bufferedMessages[channel] = []
    }
  },
  ADD_TO_BUFFER (state, { channel, message }: { channel: string; message: SerializedMessage }) {
    state.bufferedMessages[channel].push(message)
  },
  CLEAR_BUFFER (state, channel: string) {
    state.bufferedMessages[channel] = []
  }

}
export default mutation
