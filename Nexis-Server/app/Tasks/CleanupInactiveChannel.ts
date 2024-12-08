import { BaseTask } from 'adonis5-scheduler/build/src/Scheduler/Task'
import { DateTime } from 'luxon'
import Channel from 'App/Models/Channel'
import Message from 'App/Models/Message'

export default class CleanupInactiveChannel extends BaseTask {
  public static get schedule() {
    // Use CronTimeV2 generator:
    return '0 0 * * *' // Run every day at midnight
    // or just use return cron-style string (simple cron editor: crontab.guru)
  }
  /**
   * Set enable use .lock file for block run retry task
   * Lock file save to `build/tmp/adonis5-scheduler/locks/your-class-name`
   */
  public static get useLock() {
    return false
  }

  // Scheduler logic
  public async handle() {
    console.log('Scheduler is running CleanupInactiveChannel task...')
    const thirtyDaysAgo = DateTime.local().minus({ days: 30 })

    try {
      // get the latest message for each channel
      const latestMessages = await Message.query()
        .select('channel_id')
        .max('created_at as last_message_at')
        .groupBy('channel_id')

      // create a map of channel_id to the last message date
      const channelLastMessageMap: Record<number, DateTime | null> = {}
      latestMessages.forEach((row) => {
        channelLastMessageMap[row.channel_id] = row['last_message_at']
          ? DateTime.fromSQL(row['last_message_at'])
          : null
      })

      const allChannels = await Channel.query()

      // find all channels that have no messages or have not had a message in the last 30 days
      const inactiveChannels = allChannels.filter((channel) => {
        const lastMessageAt = channelLastMessageMap[channel.id]
        return !lastMessageAt || lastMessageAt < thirtyDaysAgo
      })

      if (inactiveChannels.length) {
        console.log(`Deleting ${inactiveChannels.length} inactive channels...`)

        // delete all inactive channels
        await Promise.all(
          inactiveChannels.map(async (channel) => {
            console.log(`Deleting channel: ${channel.name}`)
            await channel.delete()
          })
        )
      } else {
        console.log('No inactive channels found.')
      }
    } catch (error) {
      console.error('Error while cleaning up inactive channels:', error)
    }
  }
}
