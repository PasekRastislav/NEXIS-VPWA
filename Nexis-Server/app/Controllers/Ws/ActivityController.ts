import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import User from 'App/Models/User'

export default class ActivityController {
  private getUserRoom(user: User): string {
    return `user:${user.id}`
  }

  public async onConnected({ socket, auth, logger }: WsContextContract) {
    // all connections for the same authenticated user will be in the room
    logger.info('new websocket connection')
    const room = this.getUserRoom(auth.user!)
    const userSockets = await socket.in(room).allSockets()

    // this is first connection for given user
    if (userSockets.size === 0) {
      socket.broadcast.emit('user:online', auth.user)
    }

    // add this socket to user room
    socket.join(room)
    // add userId to data shared between Socket.IO servers
    // https://socket.io/docs/v4/server-api/#namespacefetchsockets
    socket.data.userId = auth.user!.id
    console.log('user id', socket.data.userId)
    socket.data.userStatus = 'online'

    const allSockets = await socket.nsp.except(room).fetchSockets()
    const onlineIds = new Set<number>()

    for (const remoteSocket of allSockets) {
      onlineIds.add(remoteSocket.data.userId)
      console.log(onlineIds)
    }

    const onlineUsers = await User.findMany([...onlineIds])
    console.log('online users', onlineUsers)

    socket.emit('user:list', onlineUsers)

    logger.info('new websocket connection')
  }

  // see https://socket.io/get-started/private-messaging-part-2/#disconnection-handler
  public async onDisconnected({ socket, auth, logger }: WsContextContract, reason: string) {
    const room = this.getUserRoom(auth.user!)
    const userSockets = await socket.in(room).allSockets()
    // user is disconnected
    if (userSockets.size === 0) {
      // notify other users
      socket.broadcast.emit('user:offline', auth.user)
    }

    logger.info('websocket disconnected', reason)
  }

  public async setStatus({ socket, auth, logger }: WsContextContract, status: string) {
    try {
      console.log(`${auth.user!.user_name} is now ${status}`)
      socket.data.userStatus = status // update status
      socket.broadcast.emit('user:setStatus', { user: auth.user, status: status })
      logger.info('user status updated', { userId: auth.user!.id, status: status })
    } catch (error) {
      logger.error('Error setting status)', error)
    }
  }
}
