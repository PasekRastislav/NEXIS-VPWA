<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center blue-gradient">
        <q-card class="q-pa-md shadow-2 my_card" bordered>
          <q-form ref="form" class="q-gutter-md">
            <q-card-section class="text-center">
              <div class="text-grey-9 text-h5 text-weight-bold">Sign up</div>
              <div class="text-grey-8">Sign up below to create your account</div>
            </q-card-section>
            <q-card-section class="q-pb-none q-pt-none">
              <q-input
                name="firstName"
                id="firstName"
                v-model="form.first_name"
                label="Firstname"
                type="text"
                autofocus
              />
              <q-input
                name="lastName"
                id="lastName"
                v-model="form.last_name"
                label="Lastname"
                type="text"
                autofocus
              />
              <q-input
                name="userName"
                id="userName"
                v-model="form.user_name"
                label="Username"
                type="text"
                autofocus
              />
              <q-input
                name="email"
                id="email"
                v-model.trim="form.email"
                type="email"
                label="Email"
                autofocus
              />
              <q-input
                id="password"
                name="password"
                v-model="form.password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                bottom-slots
              >
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
              <q-input
                id="password_confirmation"
                name="password_confirmation"
                v-model="form.passwordConfirmation"
                label="Confirm Password"
                :type="showPassword ? 'text' : 'password'"
                bottom-slots
              >
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </q-card-section>
            <q-card-section class="text-center q-pt-none">
              <q-btn
                label="Register"
                color="accent"
                :loading="loading"
                @click="onSubmit"
              />
              <div class="text-grey-8">
                Already have an account?
                <q-btn label="Login" size="sm" flat :to="{ name: 'login' }"></q-btn>
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { RouteLocationRaw } from 'vue-router'

export default defineComponent({
  name: 'RegisterPage',
  data () {
    return {
      form: { first_name: '', last_name: '', user_name: '', email: '', password: '', passwordConfirmation: '' },
      showPassword: false
    }
  },
  computed: {
    redirectTo (): RouteLocationRaw {
      return { name: 'login' }
    },
    loading (): boolean {
      return this.$store.state.auth.status === 'pending'
    }
  },
  methods: {
    onSubmit () {
      console.log('dndnndn', this.form)
      this.$store.dispatch('auth/register', this.form).then(() => this.$router.push(this.redirectTo))
    }
  }
})
</script>
