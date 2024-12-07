import { RawMessage, SerializedMessage } from 'src/contracts'
import { BootParams, SocketManager } from './SocketManager'

interface ChannelUser {
  id: number;
  nickname: string;
  email: string;
}
// creating instance of this class automatically connects to given socket.io namespace
// subscribe is called with boot params, so you can use it to dispatch actions for socket events
// you have access to socket.io socket using this.socket
class ChannelSocketManager extends SocketManager {
  public subscribe ({ store }: BootParams): void {
    const channel = this.namespace.split('/').pop() as string

    this.socket.on('user:typing', ({ userId, userName, text }) => {
      console.log('Typing event received on frontend:', { userId, userName, text })
      store.dispatch('channels/setTyping', { channel, userId, userName, text })
    })

    this.socket.on('message', (message: SerializedMessage) => {
      store.commit('channels/NEW_MESSAGE', { channel, message })
    })

    this.socket.on('users', (users: ChannelUser[]) => {
      console.log('Received users event432:', users)
      store.commit('channels/SET_USERS', { channel, users })
    })

    this.socket.on('loadChannels:response', (channels) => {
      store.commit('channels/SET_JOINED_CHANNELS', channels)
    })

    this.socket.on('channel:admin', (isAdmin) => {
      console.log('Channel admin:', isAdmin, channel)
      store.commit('channels/SET_ADMIN_STATUS', { channel, isAdmin })
    })

    this.socket.on('channel:admin:error', (error) => {
      console.error('Error checking admin:', error)
    })

    this.socket.on('channel:joined', (channel) => {
      console.log('Channel joined:', channel)
      store.commit('channels/SET_JOINED_CHANNELS', [{ name: channel.name, isPrivate: channel.isPrivate }])
    })

    this.socket.on('channel:deleted', (channelName) => {
      console.log(`Channel deleted event received: ${channelName}`)
      store.commit('channels/DELETE_CHANNEL', channelName)
    })

    this.socket.on('channel:join:private', (channelName) => {
      console.log('Cannot join private channel:', channelName)
      store.commit('channels/LOADING_ERROR', new Error(`Cannot join private channel: ${channelName}`))
    })

    this.socket.on('channel:access:denied', (error) => {
      console.log('Access denied to private channel:', error)
      store.commit('channels/LOADING_ERROR', new Error(error.message))
    })

    this.socket.on('user:invited', ({ channel, user }) => {
      console.log('User invited:', user, 'to channel:', channel)
      store.commit('channels/SET_JOINED_CHANNELS', [{ name: channel.name, isPrivate: channel.isPrivate }])
    })

    this.socket.on('user:revoked', ({ channel, user }) => {
      console.log('User revoked:', user, 'from channel:', channel)
      store.commit('channels/REMOVE_JOINED_CHANNEL', channel.name)
    })

    this.socket.on('user:kicked', ({ channel, user }) => {
      console.log('User kicked:', user, 'from channel:', channel)
      store.commit('channels/REMOVE_JOINED_CHANNEL', channel.name)
    })
  }

  public addMessage (message: RawMessage): Promise<SerializedMessage> {
    return this.emitAsync('addMessage', message)
  }

  public emitAsyncWrapper (event: string, data:{name:string, isPrivate:boolean}): Promise<never> {
    console.log('emitAsyncWrapper', event, data)
    return this.emitAsync(event, data)
  }

  public emitAsyncWrapper2 (event: string, data:{name:string}): Promise<never> {
    return this.emitAsync(event, data)
  }

  public loadMessages (): Promise<SerializedMessage[]> {
    return this.emitAsync('loadMessages')
  }

  public async listUsers (): Promise<string[]> {
    console.log('Listing users in channel service:', this.namespace)
    return await this.emitAsync('listUsers')
  }

  public loadChannels (): Promise<void> {
    console.log('ChannelSocket')
    return this.emitAsync('loadChannels')
  }

  public inviteUser (user: string): Promise<void> {
    return this.emitAsync('inviteUser', user)
  }

  public revokeUser (user: string): Promise<void> {
    return this.emitAsync('revokeUser', user)
  }

  public kickUser (user: string): Promise<void> {
    return this.emitAsync('kickUser', user)
  }

  public sendTyping (channel: string, text: string): void {
    console.log('Sending typing event with text :', text)
    this.socket.emit('userTyping', { text })
  }
}

class ChannelService {
  private channels: Map<string, ChannelSocketManager> = new Map()

  private rootChannel: ChannelSocketManager
  constructor () {
    this.rootChannel = new ChannelSocketManager('/')
  }

  public loadChannels (): Promise<void> {
    console.log('channelService')
    return this.rootChannel.loadChannels()
  }

  public async join (name: string, isPrivate: boolean): Promise<ChannelSocketManager> {
    if (this.channels.has(name)) {
      throw new Error(`User is already joined in channel "${name}"`)
    }

    // connect to given channel namespace
    const channel = new ChannelSocketManager(`/channels/${name}`)
    console.log('name and private', name, isPrivate)
    console.log('Client joined room:', `/channels/${name}`)
    try {
      await channel.emitAsyncWrapper('joinChannel', { name, isPrivate })
      this.channels.set(name, channel)
    } catch (error) {
      this.channels.delete(name)
      console.error('Error joining channel:', error)
      throw error
    }
    return channel
  }

  public async leave (name: string) {
    const channel = this.channels.get(name)

    if (!channel) {
      return false
    }
    // disconnect namespace and remove references to socket
    await channel.emitAsyncWrapper('leaveChannel', { name, isPrivate: false })
    channel.destroy()

    return this.channels.delete(name)
  }

  public in (name: string): ChannelSocketManager | undefined {
    return this.channels.get(name)
  }

  public async checkAdmin (channelName: string): Promise<any> {
    try {
      const channel = this.channels.get(channelName)
      console.log('channel', channel)
      if (!channel) {
        throw new Error(`User is not joined in channel "${channelName}"`)
      }
      await channel.emitAsyncWrapper2('checkAdmin', { name: channelName })
    } catch (error) {
      console.error('Error checking admin:', error)
    }
  }

  public sendTyping (channel: string, text: string): void {
    const channelSocket = this.channels.get(channel)
    if (channelSocket) {
      channelSocket.sendTyping(channel, text)
    }
  }
}

export default new ChannelService()
