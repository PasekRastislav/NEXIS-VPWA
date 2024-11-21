<template>
  <div class="fixed-input-container">
    <q-input
      rounded
      outlined
      v-model="text"
      placeholder="Type your message or use / for command"
      @keyup.enter="send"
    >
      <template v-slot:append>
        <q-btn flat dense round icon="send" @click="send" />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')
const emit = defineEmits(['send-message'])

function send () {
  if (text.value.trim() !== '') {
    emit('send-message', text.value)
    text.value = '' // Clear the input field after sending the message
  }
}
</script>

<style scoped lang="scss">
.fixed-input-container {
  flex: 1;
  max-width: 100%;
}
</style>
