// src/store/module-activity/state.ts
import { User } from 'src/contracts'

export interface OnlineUser extends User {
  state: 'online' | 'offline' | 'dnd'
}

export interface ActivityStateInterface {
  onlineUsers: { [userId: number]: OnlineUser },
  currentUserStatus: 'online' | 'offline' | 'dnd'
}

function state (): ActivityStateInterface {
  return {
    onlineUsers: {},
    currentUserStatus: 'online'
  }
}

export default state