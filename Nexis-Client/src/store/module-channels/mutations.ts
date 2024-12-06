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
  SET_ACTIVE (state, channel: string) {
    state.active = channel
  },
  NEW_MESSAGE (state, { channel, message }: { channel: string, message: SerializedMessage }) {
    state.messages[channel].push(message)
  },
  SET_USERS () {
    console.log('Setting users in channel')
  },
  SET_JOINED_CHANNELS (state, channels: { id: number, name: string, isPrivate: boolean }[]) {
    channels.forEach(channel => {
      // Initialize messages array if it doesn't exist
      if (!state.messages[channel.name]) {
        state.messages[channel.name] = []
      }
      if (!state.isPrivate) {
        state.isPrivate = {}
      }
      state.isPrivate[channel.name] = channel.isPrivate
    })
  }
}

export default mutation
