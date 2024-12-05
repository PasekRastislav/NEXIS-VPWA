import Channel from 'App/Models/Channel'
import User from 'App/Models/User'
import MessageRepository from 'App/Repositories/MessageRepository'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ChannelController {
  public async join({ auth, request, response }: HttpContextContract) {
    const user = auth.user as User // Get the authenticated user
    const { channelName, isPrivate } = request.only(['channelName', 'isPrivate']) // Parse the request data

    try {
      let channel = await Channel.findBy('name', channelName)

      if (!channel) {
        // Create the channel if it doesn't exist
        channel = await Channel.create({
          name: channelName,
          is_private: isPrivate,
        })

        // Make the creator an admin
        await user.related('channels').attach({
          [channel.id]: { is_admin: true },
        })
        // Fetch messages for the channel
        const messageRepository = new MessageRepository()
        const messages = await messageRepository.getAll(channel.name)
        // @ts-ignore
        return response.status(201).json(channel, messages)

      }
      if (!channel.is_private) {
        await user.related('channels').attach({
          [channel.id]: { is_admin: false },
        })
        return response.status(201).json(channel)
      } else {
        return response.status(403).send({ error: 'Channel is private' })
      }
    } catch (error) {
      console.error('Error joining or creating channel:', error)
      return response.status(500).send({ error: 'Failed to join or create channel' })
    }
  }
}
