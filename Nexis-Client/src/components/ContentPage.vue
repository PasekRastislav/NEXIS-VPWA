<template>
  <q-page padding>
    <template v-if="activeChannel">
      <q-infinite-scroll
        reverse
        @load="loadMoreMessages"
        :offset="200">
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner color="primary" name="dots" size="40px"/>
          </div>
        </template>
        <div class="q-pa-md row items-start justify-end">

          <div style="width: 100%;">
            <q-chat-message
              v-for="(message, index) in messages"
              :key="index"
              :name="message.userName"
              :avatar="message.avatar"
              :text="[message.text]"
              :stamp="message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })"
              :sent="message.userName === 'John Doe'"
              :bg-color="message.userName === 'John Doe' ? 'info' : 'primary'"
              :label="showLabel(index) ? formatDate(message.timestamp) : ''"
            >
            </q-chat-message>
            <q-chat-message
              name="Palo Ščerba"
              avatar="https://i.ytimg.com/vi/DUZWiXmMoC0/maxresdefault.jpg"
              bg-color="primary"
              @click="showPlaceholder = !showPlaceholder"
            >
              <template v-if="showPlaceholder">
                <div class="placeholder">btw where is my protein guys?</div>
              </template>
              <template v-else>
                <q-spinner-dots size="2rem" />
              </template>
            </q-chat-message>
          </div>
        </div>
      </q-infinite-scroll>
    </template>
    <template v-else>
      <div class="text-h6 text-center">Select a channel to start chatting</div>
    </template>
    <q-footer class="flex-footer">
      <PromptComponent v-model="text" @send-message="sendMessage"/>
    </q-footer>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, watch, ref, nextTick } from 'vue'
import PromptComponent from 'components/PromptComponent.vue'
import { Notify, scroll } from 'quasar'
import { Message } from 'components/models'

const { setVerticalScrollPosition } = scroll

export default defineComponent({
  components: { PromptComponent },
  name: 'ContentPage',
  props: {
    activeChannel: {
      type: Number,
      required: false,
      default: null
    }
  },
  setup (props) {
    const text = ref('')
    const showPlaceholder = ref(false)

    const messages = ref<Message[]>([
      { id: 1, userName: 'GogomanTV', channelId: 1, text: 'Yo, we need to plan a meeting to discuss the upcoming product launch.', timestamp: new Date('2024-07-17T11:11:00'), avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnlhmIMyTezz0ViDYMMvoOVNESnBQqCi2HcA&s' },
      { id: 2, userName: 'Palo Ščerba', channelId: 1, text: 'What day works for everyone?', timestamp: new Date('2024-09-20T14:00:00'), avatar: 'https://i.ytimg.com/vi/DUZWiXmMoC0/maxresdefault.jpg' },
      { id: 3, userName: 'ResttPowered', channelId: 1, text: 'I’m available on Wednesday or Friday this week.', timestamp: new Date('2024-09-28T12:00:00'), avatar: 'https://fs5.mojevideo.sk/imgxl/141577.jpg' },
      { id: 4, userName: 'John Doe', channelId: 1, text: 'Afternoons would be better for me.', timestamp: new Date('2024-10-01T14:40:00'), avatar: 'https://cdn.quasar.dev/img/avatar.png' },
      { id: 5, userName: 'Separ', channelId: 1, text: 'I can do Wednesday at 3 PM, but Friday is tricky for me.', timestamp: new Date('2024-10-11T12:10:00'), avatar: 'https://cdn.ticketlive.cz/upload/obrazek/nahled/o16tp-separ.jpg' },
      { id: 6, userName: 'ResttPowered', channelId: 1, text: 'Wednesday looks good for me :)', timestamp: new Date('2024-10-16T16:00:00'), avatar: 'https://fs5.mojevideo.sk/imgxl/141577.jpg' },
      { id: 7, userName: 'GogomanTV', channelId: 1, text: 'Alright, Wednesday at 3 PM it is! I’ll send out the calendar invite', timestamp: new Date('2024-10-17T17:10:00'), avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnlhmIMyTezz0ViDYMMvoOVNESnBQqCi2HcA&s' },
      { id: 8, userName: 'Palo Ščerba', channelId: 1, text: 'We should also discuss the frontend deployment', timestamp: new Date('2024-10-19T11:00:00'), avatar: 'https://i.ytimg.com/vi/DUZWiXmMoC0/maxresdefault.jpg' },
      { id: 9, userName: 'ResttPowered', channelId: 1, text: 'Great idea Palo', timestamp: new Date('2024-10-20T11:05:00'), avatar: 'https://fs5.mojevideo.sk/imgxl/141577.jpg' }
    ])

    watch(() => props.activeChannel, (newChannel) => {
      if (newChannel) {
        // Fetch new messages for the new channel
        console.log(`Channel changed to: ${newChannel}`)
      }
    })

    // Just a simulation for now for loading more messages
    function loadMoreMessages (index: number, done: (stop?: boolean) => void) {
      setTimeout(() => {
        const moreMessages = [
          { id: messages.value.length + 1, userName: 'John Doe', channelId: 1, text: 'I am fine, thank you', timestamp: new Date('2021-07-17T16:00:00'), avatar: 'https://cdn.quasar.dev/img/avatar.png' },
          { id: messages.value.length + 2, userName: 'Palo Ščerba', channelId: 1, text: 'We haven’t got a meeting since october', timestamp: new Date('2022-05-17T16:00:00'), avatar: 'https://i.ytimg.com/vi/DUZWiXmMoC0/maxresdefault.jpg' }
        ]
        if (moreMessages.length > 0) {
          messages.value.unshift(...moreMessages)
          done() // continue loading
        } else {
          done(true) // stop loading, no more messages
        }
      }, 2000)
    }
    function handleCommand (command: string) {
      console.log(`Handling command: ${command}`)
      if (command === '/list') {
        messages.value.push({
          id: messages.value.length + 1,
          userName: 'System',
          channelId: props.activeChannel,
          text: 'List of users: John Doe, Palo Ščerba, ResttPowered, GogomanTV, Separ',
          timestamp: new Date(),
          avatar: 'https://static-00.iconduck.com/assets.00/robot-icon-485x512-a3dpk3b2.png'

        })
      } else if (command === '/quit') {
        Notify.create({
          color: 'red-5',
          textColor: 'white',
          icon: 'warning',
          message: 'You have left the chat',
          position: 'top'
        })
      } else {
        messages.value.push({
          id: messages.value.length + 1,
          userName: 'System',
          channelId: props.activeChannel,
          text: 'Unknown command',
          timestamp: new Date(),
          avatar: 'https://static-00.iconduck.com/assets.00/robot-icon-485x512-a3dpk3b2.png'
        })
      }
    }
    function sendMessage (content: string) {
      if (content.startsWith('/')) {
        handleCommand(content)
      } else {
        messages.value.push({
          id: messages.value.length + 1,
          userName: 'John Doe',
          channelId: 1,
          text: content,
          timestamp: new Date(),
          avatar: 'https://cdn.quasar.dev/img/avatar.png'
        })
        text.value = ''
        nextTick(() => {
          const container = document.querySelector('.html')
          if (container) {
            setVerticalScrollPosition(container, container.scrollHeight, 0)
          }
        })
      }
    }
    function showLabel (index: number): boolean {
      if (index === 0) return true
      const currentMessage = messages.value[index]
      const previousMessage = messages.value[index - 1]
      return currentMessage.timestamp.toDateString() !== previousMessage.timestamp.toDateString()
    }

    function formatDate (date: Date): string {
      return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
    }

    return {
      messages,
      loadMoreMessages,
      text,
      sendMessage,
      props,
      showPlaceholder,
      showLabel,
      formatDate
    }
  }
})
</script>

<style scoped>

.flex-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}
</style>
