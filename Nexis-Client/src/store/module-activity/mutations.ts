import { MutationTree } from 'vuex'
import { ActivityStateInterface, OnlineUser } from './state'
import { User } from 'src/contracts'

const mutation: MutationTree<ActivityStateInterface> = {
  SET_ONLINE_USERS (state, users: User[]) {
    const newUsers: { [key: number]: OnlineUser } = {}
    users.forEach(user => {
      newUsers[user.id] = { ...user, state: 'online' }
    })
    state.onlineUsers = newUsers
  },
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
  },
  SET_CURRENT_USER_STATUS (state, status: 'online' | 'offline' | 'dnd') {
    state.currentUserStatus = status
    console.log('User status updated:', status)
  }
}

export default mutation
