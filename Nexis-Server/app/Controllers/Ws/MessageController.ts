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

  public async addMessage({ params, socket, auth }: WsContextContract, content: any) {
    const isSystem = content.system || false // Check if it's a system message
    const message = await this.messageRepository.create(
      params.name,
      isSystem ? 0 : auth.user!.id,
      content
    ) // broadcast message to other users in channel
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
      //filter only names
      const channelUsersNames = channelUsers.map((user) => user.user_name)
      console.log(channelUsersNames)
      socket.emit('users', channelUsersNames)
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

      const channels = await Promise.all(
        user.channels.map(async (channel) => {
          const userInChannel = await Database.from('channel_users')
            .where('user_id', auth.user!.id)
            .andWhere('channel_id', channel.id)
            .first()
          return {
            id: channel.id,
            name: channel.name,
            isPrivate: Boolean(channel.is_private),
            isBanned: Boolean(userInChannel?.is_banned),
          }
        })
      )
      socket.emit('loadChannels:response', channels)
    } catch (error) {
      console.error('Error loading channels:', error)
      socket.emit('loadChannels:error', error)
    }
  }
  public async checkAccess({ params, socket, auth }: WsContextContract) {
    console.log('Checking access...')
    try {
      // Retrieve the channel by name
      const channel = await Channel.findByOrFail('name', params.name)

      // Normalize `is_private` to boolean
      const isChannelPrivate = Boolean(channel.is_private)
      console.log('Channel private is :', isChannelPrivate)

      // Handle public channels
      if (!isChannelPrivate) {
        console.log('Public channel, allowing access...')
        socket.emit('channel:access:granted', channel)
        return
      }

      // Handle private channels
      if (isChannelPrivate) {
        console.log('Private channel, checking access...')
        const userInChannel = await Database.from('channel_users')
          .where('user_id', auth.user!.id)
          .andWhere('channel_id', channel.id)
          .first()

        if (userInChannel) {
          socket.emit('channel:access:granted', channel)
        } else {
          console.log('Access denied to private channel.')
          socket.emit('channel:access:denied', { message: 'Access denied to private channel.' })
        }
      }
    } catch (error) {
      console.error('Error checking access:', error.message)
      socket.emit('channel:access:error', { message: error.message })
    }
  }
  public async joinChannel(
    { params, socket, auth }: WsContextContract,
    { isPrivate }: { isPrivate: boolean }
  ) {
    console.log('Joining channel...')
    let channelDict
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

        channelDict = {
          id: channel.id,
          name: channel.name,
          isPrivate: Boolean(channel.is_private),
        }

        socket.emit('channel:joined', channelDict)
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
        socket.emit('channel:join:private', channel.name)
        throw new Error('Private channel, access denied.')
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
        socket.broadcast.emit('channel:deleted', channel.name)
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

  public async checkAdmin({ params, socket, auth }: WsContextContract) {
    console.log('Checking admin...')
    try {
      // Retrieve the channel by name
      console.log('Checking admin123132...')
      const channel = await Channel.findByOrFail('name', params.name)
      console.log('Channel found:', channel)
      const user = auth.user as User
      console.log('User:', user)

      // Check if the user is an admin of the channel
      const channelUser = await Database.from('channel_users')
        .where('user_id', user.id)
        .andWhere('channel_id', channel.id)
        .first()
      channelUser.is_admin = channelUser.is_admin === 1 || channelUser.is_admin === '1'
      console.log('User is admin:', channelUser.is_admin)
      socket.emit('channel:admin', channelUser.is_admin)
      console.log('User is admin:', channelUser.is_admin)
    } catch (error) {
      console.error('Error checking admin:', error.message)
      socket.emit('channel:admin:error', { message: error.message })
    }
  }

  public async inviteUser({ params, socket, auth }: WsContextContract, user: string) {
    console.log('Inviting user...')
    try {
      // Retrieve the channel by name
      const channel = await Channel.findByOrFail('name', params.name)
      const invitingUser = auth.user as User
      const isChannelPrivate = Boolean(channel.is_private)
      // Check if the user is an admin of the channel
      const channelUser = await Database.from('channel_users')
        .where('user_id', invitingUser.id)
        .andWhere('channel_id', channel.id)
        .first()
      channelUser.is_admin = channelUser.is_admin === 1 || channelUser.is_admin === '1'
      if (!channelUser.is_admin && isChannelPrivate) {
        console.log('Only admins can invite users.')
        throw new Error('Only admins can invite users.')
      }

      // Retrieve the user by username
      const invitedUser = await User.findByOrFail('user_name', user)
      if (!invitedUser) {
        console.log('User does not exist.')
        throw new Error('User does not exist.')
      }

      // Check if the user is already in the channel
      const userInChannel = await Database.from('channel_users')
        .where('user_id', invitedUser.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (userInChannel) {
        if (userInChannel.isBanned) {
          if (isChannelPrivate) {
            // set isBanned to false
            await Database.from('channel_users')
              .where('user_id', invitedUser.id)
              .andWhere('channel_id', channel.id)
              .update('is_banned', false)
            console.log('User is banned, unbanned from channel')
          } else if (channelUser.is_admin) {
            // set isBanned to false
            await Database.from('channel_users')
              .where('user_id', invitedUser.id)
              .andWhere('channel_id', channel.id)
              .update('is_banned', false)
            console.log('User is banned, unbanned from channel')
          } else {
            console.log('User is banned from channel.')
            throw new Error('User is banned from channel.')
          }
        } else {
          console.log('User is already in the channel.')
          throw new Error('User is already in the channel.')
        }
      } else {
        // Add the user to the channel
        await Database.table('channel_users').insert({
          user_id: invitedUser.id,
          channel_id: channel.id,
        })

        // Emit the `user:invited` event
        socket.to(invitedUser.id.toString()).emit('user:invited', {
          channel: { name: channel.name, isPrivate: channel.is_private },
          user: invitedUser.user_name,
        })
        console.log('User successfully invited to channel:', channel)
      }
    } catch (error) {
      console.error('Error inviting user:', error.message)
      socket.emit('user:invite:error', {
        message: error.message,
      })
    }
  }

  public async revokeUser({ params, socket, auth }: WsContextContract, user: string) {
    console.log('Revoking user...')
    try {
      // Retrieve the channel by name
      const channel = await Channel.findByOrFail('name', params.name)
      const invitingUser = auth.user as User
      // Check if the user is an admin of the channel
      const channelUser = await Database.from('channel_users')
        .where('user_id', invitingUser.id)
        .andWhere('channel_id', channel.id)
        .first()
      channelUser.is_admin = channelUser.is_admin === 1 || channelUser.is_admin === '1'
      if (!channelUser.is_admin) {
        console.log('Only admins can revoke users.')
        throw new Error('Only admins can revoke users.')
      }

      // Retrieve the user by username
      const revokedUser = await User.findByOrFail('user_name', user)
      if (!revokedUser) {
        console.log('User does not exist.')
        throw new Error('User does not exist.')
      }

      // Check if the user is already in the channel
      const userInChannel = await Database.from('channel_users')
        .where('user_id', revokedUser.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (!userInChannel) {
        console.log('User is not in the channel.')
        throw new Error('User is not in the channel.')
      }

      // Remove the user from the channel
      await Database.from('channel_users')
        .where('user_id', revokedUser.id)
        .andWhere('channel_id', channel.id)
        .delete()

      socket.to(revokedUser.id.toString()).emit('user:revoked', {
        channel: { name: channel.name, isPrivate: channel.is_private },
        user: revokedUser.user_name,
      })
      console.log('User successfully revoked from channel:', channel)
    } catch (error) {
      console.error('Error revoking user:', error.message)
      socket.emit('user:revoke:error', {
        message: error.message,
      })
    }
  }

  public async kickUser({ params, socket, auth }: WsContextContract, user: string) {
    console.log('Kicking user...')
    try {
      // Retrieve the channel by name
      const channel = await Channel.findByOrFail('name', params.name)
      const kickingUser = auth.user as User
      const isChannelPrivate = Boolean(channel.is_private)
      // Check if the user is an admin of the channel
      const channelUser = await Database.from('channel_users')
        .where('user_id', kickingUser.id)
        .andWhere('channel_id', channel.id)
        .first()
      channelUser.is_admin = channelUser.is_admin === 1 || channelUser.is_admin === '1'
      if (!channelUser.is_admin && isChannelPrivate) {
        console.log('Only admins can kick users.')
        throw new Error('Only admins can kick users.')
      }

      // Retrieve the user by username
      const kickedUser = await User.findByOrFail('user_name', user)
      if (!kickedUser) {
        console.log('User does not exist.')
        throw new Error('User does not exist.')
      }

      // Check if the user is in the channel
      const userInChannel = await Database.from('channel_users')
        .where('user_id', kickedUser.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (!userInChannel) {
        console.log('User is not in the channel.')
        throw new Error('User is not in the channel.')
      }

      // if user is admin then kick_count is 3
      if (channelUser.is_admin) {
        await Database.from('channel_users')
          .where('user_id', kickedUser.id)
          .andWhere('channel_id', channel.id)
          .update('is_banned', 1)
          .update('kick_count', 0)
        console.log('User is admin, banned from channel')
      } else {
        // if user is not admin then kick_count + 1
        await Database.from('channel_users')
          .where('user_id', kickedUser.id)
          .andWhere('channel_id', channel.id)
          .increment('kick_count', 1)
        console.log('User kicked from channel:', channel)
        if (userInChannel.kick_count === 3) {
          await Database.from('channel_users')
            .where('user_id', kickedUser.id)
            .andWhere('channel_id', channel.id)
            .update('is_banned', 1)
            .update('kick_count', 0)
          console.log('User is banned from channel')
        }
      }
      socket.to(kickedUser.id.toString()).emit('user:kicked', {
        channel: { name: channel.name, isPrivate: channel.is_private },
        user: kickedUser.user_name,
      })
      console.log('User successfully kicked from channel:', channel)
    } catch (error) {
      console.error('Error kicking user:', error.message)
      socket.emit('user:kick:error', {
        message: error.message,
      })
    }
  }
}
