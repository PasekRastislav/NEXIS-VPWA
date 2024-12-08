import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext'
import type { MessageRepositoryContract } from '@ioc:Repositories/MessageRepository'
import { inject } from '@adonisjs/core/build/standalone'
import Channel from 'App/Models/Channel'
import User from 'App/Models/User'
import Database from '@ioc:Adonis/Lucid/Database'
import Ws from '@ioc:Ruby184/Socket.IO/Ws'

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
      console.log('Emitting users123:', channelUsersNames)
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
          // Exclude channels where the user is banned
          if (userInChannel?.is_banned) {
            return null // Mark banned channels as null
          }
          return {
            id: channel.id,
            name: channel.name,
            isPrivate: Boolean(channel.is_private),
            isBanned: Boolean(userInChannel?.is_banned),
          }
        })
      )
      const filteredChannels = channels.filter((channel) => channel !== null)
      socket.emit('loadChannels:response', filteredChannels)
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

        socket.emit('channel:joined', channelDict, user.user_name)
        console.log('Channel created and user added as admin:', channel)
        return
      }
      // Normalize `is_private` to boolean
      const isChannelPrivate = Boolean(channel.is_private)

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

        Ws.io.emit('joined', {
          channel: { name: channel.name, isPrivate: channel.is_private },
          user: user.user_name,
        })
        socket.broadcast.emit('channel:joined', {
          channel: { name: channel.name, isPrivate: channel.is_private },
          user: user.user_name,
        })
        console.log('User successfully joined public channel:', channel)
        return
      }

      // Handle private channels
      if (isChannelPrivate) {
        console.log('Channel is private, cannot join...')
        throw new Error('Private channel, access denied.')
      }
    } catch (error) {
      console.error('Error joining channel:', error.message)
      throw new Error('Error joining channel:')
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

      // Retrieve the user by username
      const invitedUser = await User.findByOrFail('user_name', user)

      // Check if the inviting user is in the channel
      const inviterInChannel = await Database.from('channel_users')
        .where('user_id', invitingUser.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (!inviterInChannel) {
        console.log('Inviter is not in the channel.')
        throw new Error('You must be in the channel to invite users.')
      }

      // Check if the user is already in the channel
      const userInChannel = await Database.from('channel_users')
        .where('user_id', invitedUser.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (userInChannel) {
        if (userInChannel.is_banned) {
          if (inviterInChannel.is_admin) {
            // Remove the ban and re-add the user to the channel
            await Database.from('channel_users')
              .where('user_id', invitedUser.id)
              .andWhere('channel_id', channel.id)
              .update({
                is_banned: false,
                kick_count: 0, // Reset kick count
              })

            // Remove all kick records for the invited user in this channel
            await Database.from('kicks')
              .where('user_id', invitedUser.id)
              .andWhere('channel_id', channel.id)
              .delete()

            Ws.io.emit('invited', {
              channel: { name: channel.name, isPrivate: channel.is_private },
              user: invitedUser.user_name,
            })
            socket.broadcast.emit('user:invited', {
              channel: { name: channel.name, isPrivate: channel.is_private },
              user: invitedUser.user_name,
            })
            console.log('Ban removed and user invited:', invitedUser.user_name)
          } else {
            // Non-admin cannot invite a banned user
            throw new Error(
              `${user} is banned from this channel. Only admins can manage banned users.`
            )
          }
        } else {
          console.log('User is already in the channel.')
          throw new Error(`${user} is already in the channel.`)
        }
      } else {
        if (isChannelPrivate && !inviterInChannel.is_admin) {
          throw new Error('Only admins can invite users to private channels.')
        }
        // Add the user to the channel
        await Database.table('channel_users').insert({
          user_id: invitedUser.id,
          channel_id: channel.id,
        })
        Ws.io.emit('invited', {
          channel: { name: channel.name, isPrivate: channel.is_private },
          user: invitedUser.user_name,
        })
        socket.broadcast.emit('user:invited', {
          channel: { name: channel.name, isPrivate: channel.is_private },
          user: invitedUser.user_name,
        })
        console.log('User successfully invited to channel:', channel.name)
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

      // Check if the user is in the channel
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
      Ws.io.emit('user:revoked', {
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

      // Check if the user performing the kick is in the channel
      const channelUser = await Database.from('channel_users')
        .where('user_id', kickingUser.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (!channelUser) {
        console.log('Only channel members can kick users.')
        throw new Error('Only channel members can kick users.')
      }

      channelUser.is_admin = channelUser.is_admin === 1 || channelUser.is_admin === '1'

      // Non-admins cannot kick users from private channels
      if (!channelUser.is_admin && channel.is_private) {
        console.log('Only admins can kick users from private channels.')
        throw new Error('Only admins can kick users from private channels.')
      }

      // Retrieve the user to be kicked
      const kickedUser = await User.findByOrFail('user_name', user)

      if (!kickedUser) {
        console.log('User does not exist.')
        throw new Error('User does not exist.')
      }

      // Check if the user is part of the channel
      const userInChannel = await Database.from('channel_users')
        .where('user_id', kickedUser.id)
        .andWhere('channel_id', channel.id)
        .first()

      if (!userInChannel) {
        console.log('User is not in the channel.')
        throw new Error('User is not in the channel.')
      }

      // If the kicking user is an admin, ban the kicked user immediately
      if (channelUser.is_admin) {
        await Database.from('channel_users')
          .where('user_id', kickedUser.id)
          .andWhere('channel_id', channel.id)
          .update({
            is_banned: true,
          })

        console.log('Admin banned user immediately:', kickedUser.user_name)
        Ws.io.emit('user:kicked', {
          channel: { name: channel.name, isPrivate: channel.is_private },
          user: kickedUser.user_name,
        })
        return
      }

      // Track the kick in the `kicks` table
      await Database.table('kicks').insert({
        user_id: kickedUser.id,
        channel_id: channel.id,
        created_by: kickingUser.id, // The user performing the kick
      })

      // Count the number of unique users who have kicked the target user
      const uniqueKickers = await Database.from('kicks')
        .where('channel_id', channel.id)
        .andWhere('user_id', kickedUser.id)
        .countDistinct('created_by as unique_kickers')

      const kickerCount = Number(uniqueKickers[0].unique_kickers)

      console.log(`Unique kickers for ${kickedUser.user_name}:`, kickerCount)

      // If kicked by 3 unique users, ban the user
      if (kickerCount >= 3) {
        await Database.from('channel_users')
          .where('user_id', kickedUser.id)
          .andWhere('channel_id', channel.id)
          .update({
            is_banned: true,
          })

        console.log('User banned after being kicked by 3 unique users:', kickedUser.user_name)

        Ws.io.emit('user:kicked', {
          channel: { name: channel.name, isPrivate: channel.is_private },
          user: kickedUser.user_name,
        })
      } else {
        console.log('User kicked but not yet banned:', kickedUser.user_name)
      }
    } catch (error) {
      console.error('Error kicking user:', error.message)
      socket.emit('user:kick:error', {
        message: error.message,
      })
    }
  }

  public async userTyping(
    { params, socket, auth }: WsContextContract,
    typingData: { text: string }
  ) {
    try {
      const channel = await Channel.findByOrFail('name', params.name)
      const user = auth.user as User
      console.log('Typing event received:', typingData, 'from channel:', params.name)
      // Broadcast typing event to everyone in the channel except the sender
      console.log('Broadcasting typing event to room:', `channels:${channel.name}`)
      socket.broadcast.emit('user:typing', {
        userId: user.id,
        userName: user.user_name,
        channelName: channel.name,
        text: typingData.text,
      })
      console.log(
        'broadcasted',
        `channels:${channel.name}`,
        user.id,
        user.user_name,
        channel.name,
        typingData.text
      )
    } catch (error) {
      console.error('Error in typing event:', error)
    }
  }
}
