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
    console.log('Listing users in channel:', channel)
    const channelSocket = channelService.in(channel)
    const users = await channelSocket?.listUsers()
    commit('SET_USERS', { channel, users: users || [] })
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
  }
}

export default actions
