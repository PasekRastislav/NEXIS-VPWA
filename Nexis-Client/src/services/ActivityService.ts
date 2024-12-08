import { User } from 'src/contracts'
import { authManager } from '.'
import { SocketManager, BootParams } from './SocketManager'

export type UserStatus = 'online' | 'offline' | 'dnd'

class ActivitySocketManager extends SocketManager {
  private currentUserStatus: UserStatus = 'online'
  public subscribe ({ store }:BootParams): void {
    this.socket.on('user:list', (onlineUsers: User[]) => {
      console.log('Online users list', onlineUsers)
      store.commit('activity/SET_ONLINE_USERS', onlineUsers)
    })

    this.socket.on('user:online', (user: User) => {
      store.commit('activity/ONLINE_USER', user)
      console.log('User is online', user)
    })

    this.socket.on('user:offline', (user: User) => {
      store.commit('activity/OFFLINE_USER', user)
      console.log('User is offline', user)
    })

    authManager.onChange((token) => {
      if (token) {
        this.socket.connect()
      } else {
        this.socket.disconnect()
      }
    })
    this.socket.on('user:setStatus', ({ user, status }) => {
      const userId = user.id // Extract the user ID
      console.log(`User ID: ${userId} status updated to ${status}`)
      store.commit('activity/UPDATE_USER_STATUS', { userId, status })
    })
  }

  // public getCurrentUserStatus (): void {
  //   // eslint-disable-next-line no-unused-expressions
  //   this.currentUserStatus
  // }

  public updateUserStatus (status: UserStatus): void {
    this.currentUserStatus = status
    this.socket.emit('setStatus', status)
  }
}

export default new ActivitySocketManager('/activity')
