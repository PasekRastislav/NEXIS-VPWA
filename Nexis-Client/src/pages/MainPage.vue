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
              <q-item-section side>
                <q-icon name="keyboard_arrow_down" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-drawer>

      <!-- Main Content -->
      <q-page-container>
        <router-view />
      </q-page-container>

      <!-- Right Drawer -->
      <q-drawer v-model="rightDrawer" side="right" bordered class="drawer-gradient"
      >
        <span class="q-subtitle-1 q-pl-md"> {{ activeChannel }} </span>
        <q-item v-if="activeChannel">
          <q-item-section>Active Channel: {{ activeChannel }}</q-item-section>
          <span class="q-subtitle-1 q-pl-md"> {{ activeChannel }} </span>
        </q-item>
        <q-item v-else>
          <q-item-section>No active channel</q-item-section>
        </q-item>
        <!-- Check whether the channel is active, if active display its type       -->
        <q-item v-if="activeChannel">
          <q-item-label>
            Owner:
            {{ activeChannel.owner }}
          </q-item-label>
        </q-item>
        <q-separator/>
        <q-item v-if="activeChannel">
          <q-item-section>Users in channel:</q-item-section>
        </q-item>
<!--      here should be v-for to get users in channel  <q-item  clickable v-ripple>-->
          <q-item-section>
            <q-avatar color="secondary">
<!--avatar for user, just button with letter inside based on their username-->
            </q-avatar>
          </q-item-section>
          <q-item-section>
<!--userName-->
            <q-item-label caption>
<!--user status-->
            </q-item-label>
          </q-item-section>
        <q-separator/>
        <q-item clickable v-ripple v-if="activeChannel" @click="leaveChannel">
          <q-item-section class="row items-center justify-center">Leave Channel
            <q-icon name="logout"/>
          </q-item-section>
        </q-item>
        <q-separator/>
        <q-item clickable v-ripple @click="userList">
          <q-item-section class="row items-center justify-center">List Users
            <q-icon name="list"/>
          </q-item-section>
        </q-item>
        <q-separator/>
        <q-input v-model="channelName" label="Channel Name" outlined dense bg-color="white"/>
        <q-toggle v-model="isPrivateToggle" label="Private" dense :true-value="true" :false-value="false"/>
        <q-item clickable v-ripple @click="joinNewChannel">
          <q-item-section class="row items-center justify-center">Join Testovaci Channel
            <q-icon name="login"/>
          </q-item-section>
        </q-item>
      </q-drawer>
      <!-- Footer -->
      <q-footer>
        <q-toolbar class="bg-grey-3 text-black row">
          <q-input
            v-model="message"
            :disable="loading"
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

export default defineComponent({
  name: 'ChatLayout',
  data () {
    return {
      leftDrawerOpen: false,
      rightDrawer: false,
      message: '',
      loading: false,
      channelName: '',
      isPrivateToggle: false
    }
  },
  computed: {
    ...mapState('channels', ['deletedChannels']),
    ...mapGetters('channels', {
      channels: 'joinedChannels',
      lastMessageOf: 'lastMessageOf',
      isPrivate: 'isPrivate'
    }),
    activeChannel () {
      return this.$store.state.channels.active
    }
  },
  async mounted () {
    console.log('onmounted')
    await ChannelService.loadChannels()
    for (const channel of this.channels) {
      await this.$store.dispatch('channels/join', channel)
    }
  },
  methods: {
    async userList () {
      console.log('List of users in channel:', this.activeChannel)
      await this.$store.dispatch('channels/listUsers', this.activeChannel)
    },
    // send function for handling messages and commands
    async send () {
      this.loading = true

      try {
        await handleCommand(this.message, {
          store: this.$store,
          activeChannel: this.$store.state.channels.active || ''
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
    ...mapMutations('channels', {
      setActiveChannel: 'SET_ACTIVE'
    }),
    ...mapActions('auth', ['logout']),
    ...mapActions('channels', ['addMessage', 'join', 'leave'])
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
</style>
