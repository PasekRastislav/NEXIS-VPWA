<template>
    <q-layout view="hHh LpR lFr" class="flex-layout">
      <q-header class="no-shadow">
        <q-toolbar class="blue-gradient">
          <q-toolbar-title :class="{ ' invisible': $q.screen.lt.sm}" class="text-center">Nexis</q-toolbar-title>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <router-view/>
      </q-page-container>
    </q-layout>
</template>
<style lang="scss">
.blue-gradient {
  background: $gradient-primary;
}
</style>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MainLayout'
})
</script>
