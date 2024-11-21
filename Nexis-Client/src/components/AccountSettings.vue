<template>
  <div class="q-pa-md q-gutter-sm">
    <q-dialog v-model="show">
      <q-layout view="Lhh lpR fff" container class="bg-white text-dark">
        <q-toolbar>
          <q-toolbar-title>Account Settings</q-toolbar-title>
          <q-btn flat round dense icon="close" @click="show = false" />
        </q-toolbar>
        <q-page-container>
          <q-page padding>
            <q-form>
              <div class="text-h6 q-mb-md">Full Name</div>
              <div class="row q-gutter-md">
                <div class="col">
                  <q-input
                    v-model="firstname"
                    label="First name"
                    filled
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="person"/>
                    </template>
                  </q-input>
                </div>
                <div class="col">
                  <q-input
                    v-model="lastname"
                    label="Last Name"
                    filled
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="person"/>
                    </template>
                  </q-input>
                </div>
              </div>
              <q-input v-model="nickName"
                       label="Nick Name"
                       filled
                       class="q-mb-md"
              >
                <template v-slot:prepend>
                  <q-icon name="alternate_email"/>
                </template>
              </q-input>
              <div class="text-h6 q-mb-md">Contact information</div>
              <q-input v-model="email"
                       label="Email"
                       filled
                       lazy-rules
                       :rules="[ (val: string) => !!val && val.includes('@') && val.includes('.') || 'Valid email is required']"
                       class="q-mb-md"
              >
                <template v-slot:prepend>
                  <q-icon name="email"/>
                </template>
              </q-input>
              <q-btn type="submit" label="Save" color="primary" class="q-mb-md change-btn"/>
            </q-form>
            <div class="text-h6 q-mb-md">Security</div>
            <q-form>
              <q-input
                v-model="currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                label="Current Password"
                filled
                class="q-mb-md"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showCurrentPassword ? 'visibility_off' : 'visibility'"
                    @click="togglePasswordVisibility('current')"
                    class="cursor-pointer"
                  />
                </template>
              </q-input>
              <q-input
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                label="New Password"
                filled
                class="q-mb-md"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showNewPassword ? 'visibility_off' : 'visibility'"
                    @click="togglePasswordVisibility('new')"
                    class="cursor-pointer"
                  />
                </template>
              </q-input>
              <q-input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirm New Password"
                filled
                class="q-mb-md"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                    @click="togglePasswordVisibility('confirm')"
                    class="cursor-pointer"
                  />
                </template>
              </q-input>
              <q-btn type="submit" label="Change Password" color="primary" class="q-mb-md change-btn"/>
            </q-form>
          </q-page>

        </q-page-container>
      </q-layout>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AccountSettings',
  data () {
    return {
      show: false,
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false
    }
  },
  props: {
    layout: Boolean
  },
  watch: {
    layout (val: boolean) {
      this.show = val
    }
  },
  methods: {
    togglePasswordVisibility (field: string) {
      if (field === 'current') {
        this.showCurrentPassword = !this.showCurrentPassword
      } else if (field === 'new') {
        this.showNewPassword = !this.showNewPassword
      } else if (field === 'confirm') {
        this.showConfirmPassword = !this.showConfirmPassword
      }
    }
  }
})
</script>

<style scoped lang="scss">
.change-btn
{
  border-radius: 10px;
}

</style>
