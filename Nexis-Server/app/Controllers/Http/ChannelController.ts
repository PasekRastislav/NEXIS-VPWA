import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Channel from 'App/Models/Channel'
export default class ChannelController {
  public async joinChannel({ auth, request, response }: HttpContextContract) {
    const { channelName, isPrivate } = request.only(['channelName', 'isPrivate'])
    const user = auth.user as User
    const channelExists = await Channel.findBy('name', channelName)

    if (!channelExists) {
      const userChannel = await Channel.create({ name: channelName, is_private: isPrivate })
      await user.related('channels').attach([userChannel.id])
      console.log(userChannel)
      return response.status(201).json(userChannel)
    }
    const userChannel = await Channel.findByOrFail('name', channelName)
    if (!userChannel.is_private) {
      await user.related('channels').attach([userChannel.id])
      return response.status(201).json(userChannel)
    } else {
      return response.status(403).json({ message: 'Channel is private' })
    }
  }
}
