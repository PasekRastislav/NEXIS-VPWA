import { User } from 'src/contracts'
import { authManager } from '.'
import { SocketManager } from './SocketManager'

export type UserStatus = 'online' | 'offline' | 'dnd'

class ActivitySocketManager extends SocketManager {
  private currentUserStatus: UserStatus = 'online'
  public subscribe (): void {
    this.socket.on('user:list', (onlineUsers: User[]) => {
      console.log('Online users list', onlineUsers)
    })

    this.socket.on('user:online', (user: User) => {
      console.log('User is online', user)
    })

    this.socket.on('user:offline', (user: User) => {
      console.log('User is offline', user)
    })

    authManager.onChange((token) => {
      if (token) {
        this.socket.connect()
      } else {
        this.socket.disconnect()
      }
    })
  }

  public getCurrentUserStatus (): void {
    // eslint-disable-next-line no-unused-expressions
    this.currentUserStatus
  }

  public updateUserStatus (status: UserStatus): void {
    this.currentUserStatus = status
    this.socket.emit('user:setStatus', status)
  }
}

export default new ActivitySocketManager('/activity')
