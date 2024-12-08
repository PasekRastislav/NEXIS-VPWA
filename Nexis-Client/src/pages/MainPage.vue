<template>
  <div class="q-pa-md">
    <q-layout view="hHh LpR lFr" class="flex-layout">
      <q-header class="no-shadow">
        <q-toolbar class="blue-gradient">
          <q-btn round icon="menu" class="q-mr-sm" @click="leftDrawerOpen = !leftDrawerOpen" />

          <q-toolbar-title :class="{ ' invisible': $q.screen.lt.sm}" class="text-center">Nexis</q-toolbar-title>

          <q-btn round flat icon="logout" @click="logout" />
          <q-btn dense flat round icon="menu" @click="rightDrawer = !rightDrawer"/>
        </q-toolbar>
      </q-header>

      <!-- Left Drawer -->
      <q-drawer v-model="leftDrawerOpen" side="left" bordered class="drawer-gradient">

        <q-scroll-area style="height: calc(100% - 100px)">
          <q-list>
            <q-item
              v-for="(channel, index) in channels"
              :key="index"
              clickable
              v-ripple
              @click="setActiveChannel(channel)"
              :class="{ 'highlight-channel': channel === activeChannel }"
            >
              <q-item-section side>
                <q-icon :name="isPrivate(channel) ? 'lock' : 'lock_open'" />
              </q-item-section>
              <q-item-section>
                <q-item-label lines="1">{{ channel }}</q-item-label>
                <q-item-label class="conversation__summary" caption>
                  {{ lastMessageOf(channel)?.content || 'No messages yet' }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-drawer>

      <!-- Main Content -->
      <q-page-container>
        <q-card v-if="showNotificationRequest" flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Enable Notifications</div>
            <div class="text-subtitle2">Stay updated with important messages</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn label="Enable" color="primary" @click="handleNotificationRequest" />
            <q-btn flat label="Dismiss" @click="showNotificationRequest = false" />
          </q-card-actions>
        </q-card>
        <router-view />
      </q-page-container>

      <!-- Right Drawer -->
      <q-drawer v-model="rightDrawer" side="right" bordered class="drawer-gradient"
      >
        <q-item v-if="activeChannel">
          <q-item-section>Active Channel: {{ activeChannel }}</q-item-section>
        </q-item>
        <q-item v-else>
          <q-item-section>No active channel</q-item-section>
        </q-item>
        <q-item clickable v-ripple v-if="activeChannel" @click="leaveChannel">
          <q-item-section class="row items-center justify-center">Leave Channel
            <q-icon name="logout"/>
          </q-item-section>
        </q-item>
        <q-separator/>
        <q-item clickable v-ripple @click="handleListUsers">
          <q-item-section class="row items-center justify-center">List Users
            <q-icon name="list"/>
          </q-item-section>
        </q-item>
        <q-separator/>
        <q-separator/>
        <q-input v-model="channelName" label="Channel Name" outlined dense bg-color="white"/>
        <q-toggle v-model="isPrivateToggle" label="Private" dense :true-value="true" :false-value="false"/>
        <q-item clickable v-ripple @click="joinNewChannel">
          <q-item-section class="row items-center justify-center">Join Channel
            <q-icon name="login"/>
          </q-item-section>
        </q-item>
        <q-toggle
          v-model="notifyOnlyMentions"
          label="Notify only for messages addressed to me"
          dense
        />
        <!-- User status -->
        <q-expansion-item
          label="Status"
          caption="Set your status"
          header-class="text-white"
          expand-separator
        >
          <q-list bordered>
            <q-item
              v-for="status in statuses"
              :key="status.value"
              clickable
              v-ripple
              @click="setUserStatus(status.value)"
              :active="userState === status.value"
            >
              <q-item-section avatar>
                <q-icon :name="status.icon" :color="status.color" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-white">{{ status.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
        <q-expansion-item
          label="Users in Active Channel"
          caption="Displays all users and their statuses"
          header-class="text-white"
          expand-separator
          @click="userList"
        >
          <q-list bordered>
            <q-item v-for="(user, index) in usersArr" :key="index" clickable>
              <q-item-section avatar>
                <q-icon
                  :name="
              user.state === 'online'
                ? 'check_circle'
                : user.state === 'dnd'
                ? 'do_not_disturb'
                : 'remove_circle'
            "
                  :color="
              user.state === 'online'
                ? 'positive'
                : user.state === 'dnd'
                ? 'warning'
                : 'grey'
            "
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user.userName }}</q-item-label>
                <q-item-label caption>{{ user.state }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>

      </q-drawer>
      <!-- Footer -->
      <q-footer>
        <q-toolbar class="bg-grey-3 text-black row">
          <q-input
            v-model="message"
            :disable="loading"
            @keydown="onTyping"
            @keydown.enter.prevent="send"
            rounded
            outlined
            dense
            class="WAL__field col-grow q-mr-sm"
            bg-color="white"
            placeholder="Type your message or use / for command"
          />
          <q-btn :disable="loading" @click="send" round dense flat icon="send" />
        </q-toolbar>
      </q-footer>
    </q-layout>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import ChannelService from 'src/services/ChannelService'
import { handleCommand } from 'src/chat/commandHandler'
import debounce from 'lodash/debounce'
import ActivityService from 'src/services/ActivityService'
export type UserStatus = 'online' | 'offline' | 'dnd'

interface User {
  id: string
  userName: string
  state: UserStatus
}
const requestNotificationPermission = async () => {
  console.log('Requesting notification permission...')
  try {
    const permission = await Notification.requestPermission()
    console.log('Notification permission result:', permission)
    return permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}
export default defineComponent({
  name: 'ChatLayout',
  data () {
    return {
      leftDrawerOpen: false,
      rightDrawer: false,
      message: '',
      loading: false,
      channelName: '',
      isPrivateToggle: false,
      userState: 'online', // Current status
      statuses: [
        { value: 'online', label: 'Available', icon: 'check_circle', color: 'positive' },
        { value: 'dnd', label: 'Do Not Disturb', icon: 'do_not_disturb', color: 'warning' },
        { value: 'offline', label: 'Offline', icon: 'remove_circle', color: 'grey' }
      ],
      debounceTyping: null as (() => void) | null,
      showNotificationRequest: false,
      notifyOnlyMentions: false,
      usersArr: []
    }
  },
  created () {
    this.debounceTyping = debounce(this.sendTyping, 300)
  },
  computed: {
    ...mapGetters('activity', ['allOnlineUsers']),
    ...mapState('channels', ['deletedChannels', 'notification']),
    ...mapGetters('channels', {
      channels: 'joinedChannels',
      lastMessageOf: 'lastMessageOf',
      isPrivate: 'isPrivate',
      usersInChannel: 'getUsersForChannel'
    }),
    activeChannel () {
      return this.$store.state.channels.active
    }
  },
  async mounted () {
    console.log('onmounted')
    // Check notification permission
    if (Notification.permission === 'default') {
      this.showNotificationRequest = true
    }

    // Watch visibility changes
    this.$watch(
      () => this.$q.appVisible,
      (isVisible: boolean) => {
        console.log(`App visibility changed: ${isVisible}`)
        if (!isVisible) {
          console.log('App is hidden')
        }
      }
    )
    await ChannelService.loadChannels()
    for (const channel of this.channels) {
      await this.$store.dispatch('channels/joinFirst', channel)
    }
    if (this.activeChannel) {
      console.log(`Rejoining active channel: ${this.activeChannel}`)
      await this.$store.dispatch('channels/listUsers', this.activeChannel)
    }
  },
  methods: {
    async handleNotificationRequest () {
      const granted = await requestNotificationPermission()
      if (granted) {
        console.log('Notifications are enabled!')
      } else {
        console.log('Notifications are disabled or denied.')
      }
      this.showNotificationRequest = false
    },
    sendTyping () {
      this.$store.dispatch('channels/sendTyping', this.message)
    },
    onTyping () {
      this.debounceTyping?.()
    },
    async userList () {
      if (!this.activeChannel) {
        console.error('No active channel')
        return
      }

      console.log('Fetching users for channel:', this.activeChannel)
      await this.$store.dispatch('channels/listUsers', this.activeChannel)

      const channelUsers = this.usersInChannel(this.activeChannel) || []
      const onlineUsers = this.allOnlineUsers // Fetch from Vuex
      const currentUser = this.$store.state.auth.user

      this.usersArr = channelUsers.map((userName: string) => {
        if (currentUser && userName === currentUser.userName) {
          // Handle the current user
          return {
            userName: `${userName} (me)`,
            state: this.userState
          }
        }

        // Match other users
        const matchingOnlineUser = onlineUsers.find(
          (onlineUser: any) => onlineUser.userName === userName
        )

        return {
          userName, // Username from `channelUsers`
          state: matchingOnlineUser?.state || 'offline' // State from `allOnlineUsers`, default to 'offline'
        }
      })

      console.log('Mapped users array with statuses (including current user):', this.usersArr)
    },
    updateUsersInChannel () {
      // Get users from the active channel
      const rawChannelUsers = this.$store.getters['channels/getUsersForChannel'](
        this.activeChannel
      )

      if (!rawChannelUsers) {
        this.usersArr = []
        return
      }
      const currentUser = this.$store.state.auth.user
      console.log('Current user:', currentUser)
      // Map statuses from online users
      this.usersArr = rawChannelUsers.map((userName: string) => {
        if (currentUser && userName === currentUser.userName) {
          return {
            userName,
            state: this.userState // Use the current user's status
          }
        }
        const onlineUser = this.allOnlineUsers.find(
          (user: any) => user.userName === userName
        )

        return {
          userName,
          state: onlineUser?.state || 'offline' // Default to 'offline' if not found
        }
      })

      console.log('Updated usersArr:', this.usersArr)
    },
    // send function for handling messages and commands
    async send () {
      this.loading = true

      try {
        await handleCommand(this.message, {
          store: this.$store,
          activeChannel: this.$store.state.channels.active || '',
          dialog: this.$q.dialog
        })
        // If not a command, proceed with adding the message to the channel
        if (!this.message.startsWith('/')) {
          await this.addMessage({ channel: this.$store.state.channels.active, message: this.message })
        }
      } catch (err) {
        console.error('Failed to execute command or send message:', err)
      } finally {
        this.message = '' // Clear the message input after handling
        this.loading = false
      }
    },
    async joinNewChannel () {
      try {
        await this.$store.dispatch('channels/join', { channel: this.channelName, isPrivate: this.isPrivateToggle })
        console.log('Successfully joined channel:', this.channelName)
      } catch (err) {
        console.error('Failed to join channel:', this.channelName, err)
      }
    },
    async leaveChannel () {
      try {
        await this.leave(this.activeChannel)
        console.log('Successfully left channel:', this.activeChannel)
      } catch (err) {
        console.error('Failed to leave channel:', this.activeChannel, err)
      }
    },
    handleNewNotification ({ channel, message }: { channel: string; message: any }) {
      const currentUser = this.$store.state.auth.user
      if (this.userState === 'dnd') {
        console.log('User is in Do Not Disturb mode. Skipping notification.')
        return
      }
      if (!this.$q.appVisible && Notification.permission === 'granted') {
        // Check if the user prefers notifications only for addressed messages
        if (
          this.notifyOnlyMentions &&
          (!currentUser || !message.content.includes(`@${currentUser.userName}`))
        ) {
          return // Skip notification if not addressed to the user
        }

        const notification = new Notification(`New message in ${channel}`, {
          body: `${message.author.userName}: ${message.content}`,
          icon: '/path/to/icon.png'
        })

        notification.onclick = () => {
          window.focus()
          this.setActiveChannel(channel)
        }
      }
    },
    async handleListUsers () {
      try {
        const activeChannel = this.activeChannel // Get the current active channel
        if (!activeChannel) {
          this.$q.dialog({
            title: 'Error',
            message: 'No active channel selected.'
          })
          return
        }

        let users = this.$store.state.channels.users[activeChannel] || []

        // If no users are found, dispatch an action to fetch them
        if (users.length === 0) {
          await this.$store.dispatch('channels/listUsers', activeChannel)
          users = this.$store.state.channels.users[activeChannel]
        }

        // Prepare the user list for display
        const userList = users.map(user => `• ${user}`).join('<br>') || 'No users found in this channel.'

        // Show the user list in a dialog
        this.$q.dialog({
          title: `Users in ${activeChannel}`,
          message: userList,
          html: true
        })
      } catch (error) {
        console.error('Failed to list users:', error)

        this.$q.dialog({
          title: 'Error',
          message: 'Failed to fetch user list. Please try again.'
        })
      }
    },
    async setUserStatus (status: UserStatus) {
      console.log('Setting user status to:', status)
      this.userState = status
      ActivityService.updateUserStatus(status) // Call the updateUserStatus function
    },
    ...mapMutations('channels', {
      setActiveChannel: 'SET_ACTIVE'
    }),
    ...mapActions('auth', ['logout']),
    ...mapActions('channels', ['addMessage', 'join', 'joinFirst', 'leave'])
  },
  watch: {
    notification: {
      handler (newNotification) {
        if (newNotification) {
          this.handleNewNotification(newNotification)
        }
      },
      immediate: true
    },
    activeChannel: {
      immediate: true,
      handler (newChannel) {
        if (newChannel) {
          this.updateUsersInChannel()
        }
      }
    },
    // Watch for changes to online users
    userState: {
      immediate: true,
      handler (newState) {
        console.log('User state changed:', newState)
        this.updateUsersInChannel() // Refresh the users array
      }
    },
    allOnlineUsers: {
      immediate: true,
      deep: true,
      handler () {
        this.updateUsersInChannel()
      }
    },
    currentUser: {
      deep: true, // Watch for changes to nested properties, such as `currentUser.state`
      handler (newUser) {
        if (newUser) {
          console.log('Current user status changed:', newUser)
          this.updateUsersInChannel() // Recalculate user statuses if necessary
        }
      }
    }
  }
})

</script>

<style lang="scss">
@import 'src/css/quasar.variables.scss';

.blue-gradient {
  background: $gradient-primary;
}

.drawer-gradient {
  background: $gradient-secondary;
}

.no-shadow {
  box-shadow: none !important;
}

.flex-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.q-page-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.WAL__field.q-field--outlined .q-field__control:before {
  border: none;
}

.conversation__summary {
  margin-top: 4px;
}

.highlight-channel {
  background-color: #e0f7fa; /* Light teal */
  border-left: 4px solid #00796b; /* Dark teal border */
}
</style>
