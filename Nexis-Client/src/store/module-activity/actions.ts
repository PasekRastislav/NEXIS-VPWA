import { ActionTree } from 'vuex'
import { ActivityStateInterface } from './state'
import { StateInterface } from '../index'

const actions: ActionTree<ActivityStateInterface, StateInterface> = {
  async setCurrentUserStatus ({ commit, dispatch }, status: 'online' | 'offline' | 'dnd') {
    commit('SET_CURRENT_USER_STATUS', status)

    if (status === 'online') {
      console.log('User is back online. Processing buffered messages and refreshing channels...')
      await dispatch('channels/processBufferedMessages', null, { root: true })
      await dispatch('channels/refreshChannels', null, { root: true })
    } else if (status === 'offline') {
      console.log('User is offline. Messages will be buffered.')
    }
  }
}
export default actions
