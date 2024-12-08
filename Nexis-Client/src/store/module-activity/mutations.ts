import { MutationTree } from 'vuex'
import { ActivityStateInterface } from './state'
import { User } from 'src/contracts'

const mutation: MutationTree<ActivityStateInterface> = {
  ONLINE_USER (state, user: User) {
    state.onlineUsers[user.id] = { ...user, state: 'online' }
    console.log('User is online', user)
  },

  OFFLINE_USER (state, user: User) {
    delete state.onlineUsers[user.id]
  },

  UPDATE_USER_STATUS (state, { userId, status }: { userId: number; status: 'online' | 'offline' | 'dnd' }) {
    if (state.onlineUsers[userId]) {
      state.onlineUsers[userId].state = status
    } else {
      console.warn(`User with ID ${userId} not found in onlineUsers.`)
    }
  }
}

export default mutation
