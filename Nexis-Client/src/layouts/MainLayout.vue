<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Slek Lite
        </q-toolbar-title>
        <q-btn
          v-if="$store.state.auth.loggedIn"
          @click="$store.dispatch('auth/logout')"
          label="Logout"
          color="primary"
          class="q-mt-md"
        />

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MainLayout'
})
</script>
