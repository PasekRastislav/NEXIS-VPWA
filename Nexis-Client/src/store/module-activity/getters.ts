import { GetterTree } from 'vuex'
import { StateInterface } from '../index'
import { ActivityStateInterface, OnlineUser } from './state'

const getters: GetterTree<ActivityStateInterface, StateInterface> = {
  allOnlineUsers: (state): OnlineUser[] => {
    return Object.values(state.onlineUsers)
  }
}

export default getters
