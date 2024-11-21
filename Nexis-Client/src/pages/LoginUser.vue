<script lang="ts">
import { defineComponent } from 'vue'
import { RouteLocationRaw, useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

export default defineComponent({
  name: 'LoginPage',
  data () {
    return {
      credentials: { email: '', password: '', remember: false },
      showPassword: false
    }
  },
  computed: {
    redirectTo (): RouteLocationRaw {
      return (route.query.redirect as string) || { name: 'home' }
    },
    loading (): boolean {
      return this.$store.state.auth.status === 'pending'
    }
  },
  methods: {
    onSubmit () {
      this.$store.dispatch('auth/login', this.credentials).then(() => router.push(this.redirectTo))
    }
  }
})
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center blue-gradient">
        <q-card class="my_card">
          <q-form ref="form" class="q-gutter-md">
            <q-card-section class="text-center">
              <div class="text-accent  text-h6">Sign In</div>
              <div class="text-grey-8">Sign in below to access your account</div>
            </q-card-section>
            <q-card-section class="q-pb-none q-pt-none">
              <q-input
                name="email"
                id="email"
                dense
                outlined
                v-model.trim="credentials.email"
                type="email"
                class="q-mt-md"
                label="Email"
                hint="Your email"
                lazy-rules
                :rules="[val => val && val.length > 0 || 'Email is required']"
              >
                <template v-slot:prepend>
                  <q-icon name="email"/>
                </template>
              </q-input>
              <q-input
                id="password"
                name="password"
                dense
                outlined
                v-model="credentials.password"
                class="q-mt-md"
                label="Password"
                hint="Your password"
                lazy-rules
                :rules="[val => val && val.length > 0 || 'Password is required']"
              >
                <template v-slot:prepend>
                  <q-icon name="lock"/>
                </template>
              </q-input>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <q-btn
                class="full-width q-mt-md"
                color="accent"
                label="Sign In"
                :loading="loading"
                @click="onSubmit"
                style="border-radius: 10px;"
              />
            </q-card-section>
            <q-card-section class="text-center q-pt-none">
              <div class="text-grey-8">Don't have an account?
                <q-btn label="Create account" size="sm" flat :to="{ name: 'register' }"></q-btn>
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">

.my_card {
  width: 25rem;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.7);
}

@media (max-width: 600px) {
  .my_card {
    width: 20rem;
  }
}
</style>
