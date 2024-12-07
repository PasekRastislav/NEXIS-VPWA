<template>
  <q-scroll-area ref="area" style="width: 100%; height: calc(100vh - 150px)">
    <div style="width: 100%; max-width: 400px; margin: 0 auto;">
      <q-chat-message
        v-for="message in formattedMessages"
        :key="message.id"
        :name="message.author.userName"
        :text="[message.content]"
        :stamp="message.formattedDate"
        :sent="isMine(message)"
        :bg-color="getMessageBgColor(message)"
        class="chat-message"
      >
      </q-chat-message>
    </div>
  </q-scroll-area>
</template>

<script lang="ts">
import { QScrollArea } from 'quasar'
import { SerializedMessage } from 'src/contracts'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'ChannelMessagesComponent',
  props: {
    messages: {
      type: Array as PropType<SerializedMessage[]>,
      default: () => []
    }
  },
  watch: {
    messages: {
      handler () {
        this.$nextTick(() => this.scrollMessages())
      },
      deep: true
    }
  },
  computed: {
    currentUser () {
      return this.$store.state.auth.user?.id
    },
    currentUserName () {
      return this.$store.state.auth.user?.userName
    },
    formattedMessages () {
      return this.messages.map(message => ({
        ...message,
        formattedDate: new Date(message.createdAt).toLocaleString()
      }))
    }
  },
  methods: {
    scrollMessages () {
      const area = this.$refs.area as QScrollArea
      area && area.setScrollPercentage('vertical', 1.1)
    },
    isMine (message: SerializedMessage): boolean {
      return message.author.id === this.currentUser
    },
    getMessageBgColor (message: SerializedMessage): string {
      if (message.content.includes(`@${this.currentUserName}`)) {
        return 'warning'
      }
      return this.isMine(message) ? 'primary' : 'secondary'
    }
  }
})
</script>
<style scoped>
</style>
