<template>
  <q-page class="row items-center justify-evenly">
    <channel-messages-component :messages="messages" />
    <div class="typing-indicator-container">
      <div v-for="(typingUser, userId) in typingUsers" :key="userId">
    <span @click="revealText(typingUser.userName, typingUser.text)">
      <q-icon name="keyboard" />
      {{ typingUser.userName }} is typing...
    </span>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import ChannelMessagesComponent from 'src/components/ChannelMessagesComponent.vue'
import { SerializedMessage } from 'src/contracts'
import { defineComponent } from 'vue'

export default defineComponent({
  components: { ChannelMessagesComponent },
  name: 'ChannelPage',
  computed: {
    messages (): SerializedMessage[] {
      return this.$store.getters['channels/currentMessages']
    },
    typingUsers () {
      const typingUsers = this.$store.state.channels.typingUsers || {}
      const activeChannel = this.$store.state.channels.active
      console.log('Active Channel:', activeChannel)
      console.log('Typing Users from Vuex:', typingUsers)
      if (activeChannel && typingUsers[activeChannel]) {
        return typingUsers[activeChannel]
      }
      return {} // Return an empty object if conditions aren't met
    }
  },
  methods: {
    revealText (userName: string, text: string) {
      this.$q.dialog({
        title: 'User Typing',
        message: `${userName} is typing: "${text}"`
      })
    }
  }
})
</script>
