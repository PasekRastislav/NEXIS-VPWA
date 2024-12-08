import { ActionTree } from 'vuex'
import { StateInterface } from '../index'
import { ChannelsStateInterface } from './state'
import { channelService } from 'src/services'
import { RawMessage } from 'src/contracts'

interface joinParams {
  channel: string,
  isPrivate: boolean
}
const actions: ActionTree<ChannelsStateInterface, StateInterface> = {
  async messageLoading ({ commit, state }, channel: string) {
    try {
      const channelSocket = channelService.in(channel)
      if (!channelSocket) {
        throw new Error(`No active socket connection found for channel: ${channel}`)
      }

      commit('LOADING_START')
      const messages = await channelSocket.loadMessages()
      commit('LOADING_SUCCESS', { channel, messages })
    } catch (error) {
      console.error(`Failed to load messages for channel ${channel}:`, error)
      commit('LOADING_ERROR', error)
    }
  },
  async joinFirst ({ commit }, params: string | joinParams) {
    try {
      commit('LOADING_START')
      const channel = typeof params === 'string' ? params : params.channel
      const isPrivate = typeof params !== 'string' && params.isPrivate !== undefined ? params.isPrivate : false

      // Attempt to join via the channel service
      const channelSocket = await channelService.joinFirst(channel, isPrivate)

      // Handle private channel denial
      if (!channelSocket) {
        throw new Error('Failed to join channel.')
      }

      // If successful, load messages
      const messages = await channelSocket.loadMessages()

      // Commit success only if join was successful
      commit('LOADING_SUCCESS', { channel, messages })
    } catch (err) {
      console.error('Error joining channel:', err)
      commit('LOADING_ERROR', err)
      throw err
    }
  },
  async join ({ commit }, params: string | joinParams) {
    try {
      commit('LOADING_START')
      const channel = typeof params === 'string' ? params : params.channel
      const isPrivate = typeof params !== 'string' && params.isPrivate !== undefined ? params.isPrivate : false

      // Attempt to join via the channel service
      const channelSocket = await channelService.join(channel, isPrivate)

      // Handle private channel denial
      if (!channelSocket) {
        throw new Error('Failed to join channel.')
      }

      // If successful, load messages
      const messages = await channelSocket.loadMessages()

      // Commit success only if join was successful
      commit('LOADING_SUCCESS', { channel, messages })
    } catch (err) {
      console.error('Error joining channel:', err)
      commit('LOADING_ERROR', err)
      throw err
    }
  },
  async leave ({ getters, commit }, channel: string | null) {
    const leaving: string[] = channel !== null ? [channel] : getters.joinedChannels
    console.log('odid', leaving)
    leaving.forEach((c) => {
      channelService.leave(c)
      commit('CLEAR_CHANNEL', c)
    })
  },
  async addMessage ({ commit }, { channel, message }: { channel: string, message: RawMessage }) {
    const newMessage = await channelService.in(channel)?.addMessage(message)
    commit('NEW_MESSAGE', { channel, message: newMessage })
  },
  async listUsers ({ commit }, channel: string) {
    try {
      console.log('Listing users in channel:', channel)
      const channelSocket = channelService.in(channel)
      if (!channelSocket) {
        throw new Error('Channel socket not found.')
      }
      // Commit the users to the Vuex state
      return await channelSocket.listUsers()
    } catch (error) {
      console.error('Error listing users:', error)
      throw error // Rethrow error to handle it in the caller
    }
  },
  async checkAdmin ({ commit }, channel: string) {
    try {
      return await channelService.checkAdmin(channel)
    } catch (error) {
      console.error('Error checking admin:', error)
      return false
    }
  },
  async inviteUser ({ commit }, { channel, user }) {
    try {
      const channelSocket = channelService.in(channel)
      if (!channelSocket) {
        throw new Error('Channel not found')
      }
      await channelSocket.inviteUser(user)
    } catch (err) {
      console.error('Error inviting user:', err)
    }
  },
  async revokeUser ({ commit }, { channel, user }) {
    try {
      const channelSocket = channelService.in(channel)
      if (!channelSocket) {
        throw new Error('Channel not found')
      }
      await channelSocket.revokeUser(user)
    } catch (err) {
      console.error('Error revoking user:', err)
    }
  },
  async kickUser ({ commit }, { channel, user }) {
    try {
      const channelSocket = channelService.in(channel)
      if (!channelSocket) {
        throw new Error('Channel not found')
      }
      await channelSocket.kickUser(user)
    } catch (err) {
      console.error('Error kicking user:', err)
    }
  },
  sendTyping ({ state }, text: string) {
    const activeChannel = state.active
    if (activeChannel) {
      channelService.sendTyping(activeChannel, text)
    }
  },
  setTyping ({ commit }, { channel, userId, userName, text }) {
    // Commit the initial typing state
    commit('SET_TYPING', { channel, userId, userName, text })

    // Schedule the clearing of the typing state after a delay
    setTimeout(() => {
      commit('CLEAR_TYPING', { channel, userId })
    }, 5000)
  },
  async refreshChannels ({ commit, state }) {
    try {
      await channelService.loadChannels() // Triggers the loadChannels event to update Vuex state

      // Use the updated Vuex state to verify active channel availability
      if (state.active && !state.joinedChannels.some((channel: { name: string }) => channel.name === state.active)) {
        console.log(`Active channel ${state.active} no longer available. Resetting active channel`)
        commit('SET_ACTIVE', null)
      }
    } catch (error) {
      console.error('Failed to refresh channels:', error)
    }
  }

}
export default actions
