import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import Channel from 'App/Models/Channel'

export default class Invite extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public channel_id: number

  @column()
  public status: 'pending' | 'accepted'

  @column()
  public invited_user_id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public acceptedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'invited_user_id',
  })
  public author: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channel_id',
  })
  public channel: BelongsTo<typeof Channel>
}
