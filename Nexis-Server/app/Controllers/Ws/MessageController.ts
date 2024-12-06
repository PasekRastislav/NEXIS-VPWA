import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import type { MessageRepositoryContract } from '@ioc:Repositories/MessageRepository'
import { inject } from '@adonisjs/core/build/standalone'
import Channel from 'App/Models/Channel'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'

// inject repository from container to controller constructor
// we do so because we can extract database specific storage to another class
// and also to prevent big controller methods doing everything
// controler method just gets data (validates it) and calls repository
// also we can then test standalone repository without controller
// implementation is bind into container inside providers/AppProvider.ts
@inject(['Repositories/MessageRepository'])
export default class MessageController {
  constructor(private messageRepository: MessageRepositoryContract) {}

  public async loadMessages({ params }: WsContextContract) {
    return this.messageRepository.getAll(params.name)
  }

  public async addMessage({ params, socket, auth }: WsContextContract, content: string) {
    const message = await this.messageRepository.create(params.name, auth.user!.id, content)
    // broadcast message to other users in channel
    socket.broadcast.emit('message', message)
    // return message to sender
    return message
  }

  public async listUsers({ params, socket }: WsContextContract) {
    const channel = await Channel.findByOrFail('name', params.name)
    console.log('Message Listing users in channel:', channel.name)
    try {
      const channelUsers = await Database.from('channel_users')
        .join('users', 'channel_users.user_id', 'users.id')
        .where('channel_users.channel_id', channel.id)
        .select('users.id', 'users.user_name')
      console.log(channelUsers)
      socket.emit('users', channelUsers)
    } catch (error) {
      console.error('Error fetching channel users:', error)
    }
  }
  public async loadChannels({ socket, auth }: WsContextContract) {
    console.log('kokotko')
    try {
      // Get the authenticated user and load their channels
      const user = await User.query()
        .where('id', auth.user!.id)
        .preload('channels', (query) => {
          query.select(['id', 'name', 'is_private'])
        })
        .firstOrFail()
      // Extract channels and send them back
      const channels = user.channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        isPrivate: Boolean(channel.is_private),
      }))
      console.log(channels)
      socket.emit('loadChannels:response', channels)
    } catch (error) {
      console.error('Error loading channels:', error)
      socket.emit('loadChannels:error', error)
    }
  }
  public async joinChannel(
    { params, socket, auth }: WsContextContract,
    { isPrivate }: { isPrivate: boolean }
  ) {
    console.log('Joining channel...')
    try {
      // Retrieve the channel by name
      let channel = await Channel.query().where('name', params.name).first()

      const user = auth.user as User

      if (!channel) {
        console.log('Channel does not exist, creating...')
        // Create a new channel if it doesn't exist
        await Database.table('channels').insert({
          name: params.name,
          is_private: Boolean(isPrivate),
        })

        // Fetch the newly created channel
        channel = await Channel.findByOrFail('name', params.name)

        // Add the user as an admin of the channel
        await Database.table('channel_users').insert({
          user_id: user.id,
          channel_id: channel.id,
          is_admin: Boolean(true),
        })

        socket.emit('channel:joined', channel)
        console.log('Channel created and user added as admin:', channel)
        return
      }

      console.log('Channel found:', channel)

      // Normalize `is_private` to boolean
      const isChannelPrivate = Boolean(channel.is_private)

      console.log('Channel private is :', isChannelPrivate)
      // Handle public channels
      if (!isChannelPrivate) {
        console.log('Joining a public channel...')
        const userAlreadyInChannel = await Database.from('channel_users')
          .where('user_id', user.id)
          .andWhere('channel_id', channel.id)
          .first()

        if (!userAlreadyInChannel) {
          await Database.table('channel_users').insert({
            user_id: user.id,
            channel_id: channel.id,
          })
        }

        socket.emit('channel:joined', channel)
        console.log('User successfully joined public channel:', channel)
        return
      }

      // Handle private channels
      if (isChannelPrivate) {
        console.log('Private channels are currently unsupported.')
        throw new Error('Private channels are not yet supported.')
      }
    } catch (error) {
      console.error('Error joining channel:', error.message)
      socket.emit('channel:join:error', { message: error.message })
    }
  }

  public async leaveChannel({ params, socket, auth }: WsContextContract) {
    console.log('Leaving channel...')
    try {
      // Retrieve the channel by name
      const channel = await Channel.findByOrFail('name', params.name)
      const user = auth.user as User

      // Check if the user is an admin of the channel
      const channelUser = await Database.from('channel_users')
        .where('user_id', user.id)
        .andWhere('channel_id', channel.id)
        .first()
      channelUser.is_admin = channelUser.is_admin === 1 || channelUser.is_admin === '1'
      if (channelUser.is_admin) {
        console.log('Admin leaving means channel is being removed totally.')
        await Database.from('channels').where('id', channel.id).delete()
        await Database.from('channel_users').where('channel_id', channel.id).delete()
        socket.emit('channel:deleted', channel)
        console.log('Channel successfully deleted:', channel)
        return
      }
      await Database.from('channel_users')
        .where('user_id', user.id)
        .andWhere('channel_id', channel.id)
        .delete()

      socket.emit('channel:left', channel)
      console.log('User successfully left channel:', channel)
    } catch (error) {
      console.error('Error leaving channel:', error.message)
      socket.emit('channel:leave:error', { message: error.message })
    }
  }
}
