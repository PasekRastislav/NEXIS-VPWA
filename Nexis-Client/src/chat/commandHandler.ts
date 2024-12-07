// src/chat/commandHandler.ts
import { Store as VuexStore } from 'vuex'
import { StateInterface } from 'src/store' // Ensure path accuracy based on your project structure

interface CommandHandlerOptions {
  store: VuexStore<StateInterface>
  activeChannel: string,
  dialog: (opts: any) => void
}

export async function handleCommand (message: string, options: CommandHandlerOptions): Promise<void> {
  const { store, activeChannel, dialog } = options

  // Check if the message starts with '/' which means it's a command
  if (!message.startsWith('/')) {
    // If not a command, just return
    return
  }
  console.log(activeChannel)

  // Split the message to parse the command and parameters
  const parts = message.slice(1).split(' ') // Remove the '/' and split by space
  const command = parts[0]
  const args = parts.slice(1) // Arguments after the command

  switch (command) {
    case 'join':
      if (args.length > 0) {
        const channelName = args[0]
        const isPrivate = args.includes('private')
        await store.dispatch('channels/join', { channel: channelName, isPrivate })
        console.log('Successfully joined channel:', channelName)
      } else {
        console.error('Channel name is required for /join command')
      }
      break
    case 'cancel':
      await store.dispatch('channels/leave', activeChannel)
      console.log('Left channel:', activeChannel)
      break
    case 'quit':
      await store.dispatch('channels/checkAdmin', activeChannel)
      console.log('Checking admin status', store.state.channels.adminStatus[activeChannel])
      if (store.state.channels.adminStatus[activeChannel]) {
        await store.dispatch('channels/leave', activeChannel)
        console.log('Channel deleted:', activeChannel)
      } else { console.log('You are not an admin of this channel') }
      break
    case 'list':
      try {
        let users = store.state.channels.users[activeChannel] || []

        if (users.length === 0) {
          users = await store.dispatch('channels/listUsers', activeChannel)
        }
        if (!users || users.length === 0) {
          users = await store.dispatch('channels/listUsers', activeChannel)
        }

        users = store.state.channels.users[activeChannel]
        // Display users in a dialog
        const userList = users.map(user => `• ${user}`).join('<br>')
        dialog({
          title: `Users in ${activeChannel}`,
          message: userList || 'No users found in this channel.',
          html: true
        })
      } catch (error) {
        console.error('Failed to list users:', error)
        dialog({
          title: 'Error',
          message: 'Failed to fetch user list. Please try again.'
        })
      }
      break
    case 'invite':
      if (args.length > 0) {
        const username = args[0]
        await store.dispatch('channels/inviteUser', { channel: activeChannel, user: username })
        console.log('Invited user:', username)
      } else {
        console.error('Username is required for /invite command')
      }
      break
    case 'revoke':
      if (args.length > 0) {
        const username = args[0]
        await store.dispatch('channels/revokeUser', { channel: activeChannel, user: username })
        console.log('Successfully revoked user:', username)
      } else {
        console.error('Username is required for /revoke command')
      }
      break
    case 'kick':
      if (args.length > 0) {
        const username = args[0]
        await store.dispatch('channels/kickUser', { channel: activeChannel, user: username })
        console.log('Your kick noticed:', username)
      } else {
        console.error('Username is required for /kick command')
      }
      break
    default:
      console.error('Unknown command:', command)
      break
  }
}
