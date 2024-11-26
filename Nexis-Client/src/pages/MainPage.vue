<template>
  <div class="q-pa-md">
    <q-layout view="hHh LpR lFr" class="flex-layout">
      <q-header class="no-shadow">
        <q-toolbar class="blue-gradient">
          <q-item active clickable v-ripple class="text-white">
            <q-btn round
                   icon="tag"
                   @click="onMenuClick('home')"
                   @mouseover="iconName = 'Channels'"
                   @mouseleave="iconName = ''"
            >
              <q-tooltip v-if="iconName === 'Channels'">{{ iconName }}</q-tooltip>
            </q-btn>
          </q-item>
          <q-item clickable v-ripple class="text-white">
            <q-item-section avatar>
              <q-btn round
                     icon="notifications"
                     @click="onMenuClick('activity')"
                     @mouseover="iconName = 'Activity'"
                     @mouseleave="iconName = ''"

              >
                <q-badge floating color="red" rounded/>
                <q-tooltip v-if="iconName === 'Activity'">{{ iconName }}</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-toolbar-title :class="{ ' invisible': $q.screen.lt.sm}" class="text-center">Nexis</q-toolbar-title>
          <q-item clickable v-ripple class="text-white">
            <q-item-section avatar>
              <q-btn round
                     @click="onMenuClick('profile')"
                     @mouseover="iconName = 'Profile'"
                     @mouseleave="iconName = ''"
              >
                <q-avatar size="42px" class="shadow-4">
                  <img src="https://cdn.quasar.dev/img/avatar.png" alt="User Avatar"/>
                  <q-badge color="white" class="absolute-bottom-right"
                           style="display: flex; justify-content: center; align-items: center;">
                    <q-badge class="absolute-center user-status" :color="userStatusColor">
                    </q-badge>
                  </q-badge>

                </q-avatar>
                <q-tooltip v-if="iconName === 'Profile'">{{ iconName }}</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-btn dense flat round icon="menu" @click="rightDrawer = !rightDrawer"/>
        </q-toolbar>
      </q-header>
      <!-- Left drawer      -->
      <q-drawer v-model="leftDrawer" side="left" bordered
                class="drawer-gradient">
        <q-list>
          <q-item>
            <q-btn flat dense round icon="arrow_left" @click="leftDrawer = false"/>
          </q-item>
          <template v-if="activeDrawer === 'home'">

            <q-expansion-item label="Channels" icon="tag">
              <q-list>
                <q-item v-for="channel in channels" :key="channel.id" clickable v-ripple
                        @click="selectChannel(channel.id)">
                  <q-item-section avatar>
                    <q-avatar icon="group"></q-avatar>
                  </q-item-section>
                  <q-item-section>
                    {{ channel.name }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
            <q-btn class="create-channel-btn" rounded color="accent" label="Create Channel"
                   @click="createChannel"/>
          </template>
          <template v-if="activeDrawer === 'activity'">
            <q-expansion-item label="Unread" icon="notifications">
              <q-item clickable v-ripple>
                <q-item-section>Notification 1</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Notification 2</q-item-section>
              </q-item>
            </q-expansion-item>
            <q-expansion-item label="Mentions" icon="alternate_email">
              <q-item clickable v-ripple>
                <q-item-section>Mention 1</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Mention 2</q-item-section>
              </q-item>
            </q-expansion-item>
          </template>
          <template v-if="activeDrawer === 'profile'">
            <q-item>
              <q-avatar size="50px">
                <img src="https://cdn.quasar.dev/img/avatar.png" alt="User Avatar"/>
                <q-badge color="white" class="absolute-bottom-right"
                         style="display: flex; justify-content: center; align-items: center;">
                  <q-badge class="absolute-center user-status" :color="userStatusColor">
                  </q-badge>
                </q-badge>
              </q-avatar>
            </q-item>
            <q-item v-if="currentUser">
              <q-item-section>
                <q-item-label>{{ currentUser.name }}</q-item-label>
                <q-item-label caption>{{ currentUser.email }}</q-item-label>
                <q-item-label caption>
                  Status:
                  <q-select v-model="currentUser.status" :options="['Online', 'Busy', 'Offline']"
                            @input="updateUserStatus"/>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-separator/>
            <q-item clickable v-ripple @click="showSettings = !showSettings">
              <q-item-section class="row items-center justify-center">
                Settings
                <q-icon name="settings"/>
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple>
              <q-item-section class="row items-center justify-center">Sign Out
                <q-icon name="logout"/>
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-drawer>
      <!-- Right drawer      -->
      <q-drawer v-model="rightDrawer" side="right" bordered show-if-above
      >
        <q-item v-if="activeChannel">
          <q-item-section>Active Channel: {{ activeChannelReturn["activeChannelName"] }}</q-item-section>
        </q-item>
        <q-item v-else>
          <q-item-section>No active channel</q-item-section>
        </q-item>
        <!-- Check whether the channel is active, if active display its type       -->
        <q-item v-if="activeChannel">
          <q-item-label>
            Owner:
            {{
              users.find((u: User) => u.id === parseInt(channels.find((channel: Channel) => channel.id === activeChannel)?.owner || '0'))?.name || 'Unknown User'
            }}
          </q-item-label>
        </q-item>
        <q-item v-if="activeChannel">
          <q-item-label>
            {{ channels.find((channel: Channel) => channel.id === activeChannel)?.type }}
            <q-icon v-if="channels.find((channel: Channel) => channel.id === activeChannel)?.type === 'private'"
                    name="lock"/>
            <q-icon v-else name="lock_open"/>
          </q-item-label>
        </q-item>
        <q-separator/>
        <q-item v-if="activeChannel">
          <q-item-section>Users in channel:</q-item-section>
        </q-item>
        <q-item v-for="user in activeChannelReturn.activeChannelUsers" :key="user" clickable v-ripple>
          <q-item-section>
            <q-avatar color="secondary">
              {{ users.find((u: User) => u.id === parseInt(user))?.name.charAt(0) }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            {{ users.find((u: User) => u.id === parseInt(user))?.name || 'Unknown User' }}
            <q-item-label caption>
              {{ users.find((u: User) => u.id === parseInt(user))?.status || 'Unknown Status' }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-separator/>
        <q-item clickable v-ripple v-if="activeChannel" @click="leaveChannel">
          <q-item-section class="row items-center justify-center">Leave Channel
            <q-icon name="logout"/>
          </q-item-section>
        </q-item>
        <q-separator/>
      </q-drawer>
      <q-page-container>
        <ContentPage :activeChannel="activeChannel"/>
        <AccountSettings :layout="showSettings"/>
      </q-page-container>
    </q-layout>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import ContentPage from 'components/ContentPage.vue'
import AccountSettings from 'components/AccountSettings.vue'
import { Notify } from 'quasar'
import { Channel, User } from 'components/models'

export default defineComponent({
  components: { ContentPage, AccountSettings },
  setup () {
    const leftDrawer = ref(false)
    const rightDrawer = ref(false)
    const iconName = ref('')
    const showSettings = ref(false)
    const activeDrawer = ref('')
    const currentUserId = ref(1)
    const activeChannel = ref<number | undefined>(undefined)

    const users = ref<User[]>([
      { id: 1, name: 'John Doe', email: 'Email@example.com', status: 'Online' },
      { id: 2, name: 'GogomanTV', email: 'peto.cmorik@gmail.com', status: 'Online' },
      { id: 3, name: 'ResttPowered', email: 'patejdlvaso@yahoo.com', status: 'Online' },
      { id: 4, name: 'Separ', email: 'miskokmet@icloud.com', status: 'Offline' },
      { id: 5, name: 'PaloŠčerba', email: 'palijari@gmail.com', status: 'Busy' }
    ])

    const channels = ref<Channel[]>([
      { id: 1, name: 'Pirati', users: ['1', '2', '3', '4', '5'], owner: '4', type: 'public' },
      { id: 2, name: 'FIIT', users: ['1', '3', '4'], owner: '4', type: 'private' },
      { id: 3, name: 'VPWA', users: ['1', '2', '4', '5'], owner: '3', type: 'public' }
    ])

    // Get the current logged-in user
    const currentUser = computed<User | null>(() => {
      return users.value.find(user => user.id === currentUserId.value) || null
    })

    // Get the color based of the user status
    const userStatusColor = computed((): string => {
      const user = currentUser.value as User
      if (!user.status) return 'red !important'
      switch (user.status) {
        case 'Online':
          return 'green'
        case 'Busy':
          return 'red !important'
        case 'Offline':
          return 'grey'
        default:
          return ''
      }
    })

    // Get the active channel name and users from the active channel
    const activeChannelReturn = computed(() => {
      const activeChannelName = channels.value.find(channel => channel.id === activeChannel.value)?.name || ''
      const activeChannelUsers = channels.value.find(channel => channel.id === activeChannel.value)?.users || []
      return { activeChannelName, activeChannelUsers }
    })

    const onMenuClick = (menuItem: string) => {
      if (activeDrawer.value === menuItem) {
        leftDrawer.value = !leftDrawer.value
      } else {
        leftDrawer.value = true
        activeDrawer.value = menuItem
      }
    }

    const selectChannel = (channelId: number) => {
      activeChannel.value = channelId
    }

    const leaveChannel = () => {
      if (activeChannel.value) {
        Notify.create({
          color: 'red-5',
          textColor: 'white',
          icon: 'warning',
          message: 'You have left the chat',
          position: 'top'
        })
        activeChannel.value = undefined
      }
    }
    const createChannel = () => {
      const newChannelId = Date.now()
      const newChannel: Channel = {
        id: newChannelId,
        name: `New Channel ${newChannelId}`,
        users: [currentUserId.value.toString()],
        owner: currentUserId.value.toString(),
        type: 'public'
      }
      channels.value.push(newChannel)
    }

    // Update the user status based on the selected status
    const updateUserStatus = (newStatus: string) => {
      const user = users.value.find(user => user.id === currentUserId.value)
      if (user) {
        user.status = newStatus
      }
    }

    return {
      leftDrawer,
      rightDrawer,
      iconName,
      showSettings,
      activeDrawer,
      currentUserId,
      users,
      channels,
      activeChannel,
      currentUser,
      userStatusColor,
      activeChannelReturn,
      onMenuClick,
      selectChannel,
      leaveChannel,
      createChannel,
      updateUserStatus
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

.user-status {
  border-radius: 7px;
  width: 14px;
  height: 14px
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

.q-page {
  flex: 1;
}

.flex-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.create-channel-btn {
  position: absolute;
  width: 80%;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.7;
}

</style>
