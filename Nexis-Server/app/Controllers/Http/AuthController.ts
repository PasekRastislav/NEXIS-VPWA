import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Channel from 'App/Models/Channel'
import User from 'App/Models/User'
import RegisterUserValidator from 'App/Validators/RegisterUserValidator'

export default class AuthController {
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  async register({ request }: HttpContextContract) {
    const data = await request.validate(RegisterUserValidator)
    const user = await User.create(data)
    // join user to general channel
    const general = await Channel.findByOrFail('name', 'general')
    await user.related('channels').attach([general.id])
    return user
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  async login({ auth, request }: HttpContextContract) {
    const email = request.input('email')
    const password = request.input('password')

    return auth.use('api').attempt(email, password)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  async logout({ auth }: HttpContextContract) {
    return auth.use('api').logout()
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  async me({ auth }: HttpContextContract) {
    await auth.user!.load('channels')
    return auth.user
  }
}
