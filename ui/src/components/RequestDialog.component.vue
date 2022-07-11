<template>
  <el-dialog v-model="dialogVisible" v-on:close="this.closeDialog()" title="Request Access" width="50%" draggable>
    <el-row v-loading="this.loading" :gutter="10" :justify="'center'">
      <el-row v-if="isLoggedIn">
        <el-row>
          <p class="flex flex-col items-center" v-if="this.enrollmentUrl">
            <a :href="this.enrollmentUrl"
               target="_blank" :class="this.enrollmentClass"
               :underline="false">{{
                this.enrollmentLabel
              }}
            </a>
            <br/>
            <input type="button" value="Check Memberships" id="key" name="key"
                   class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                   @click="this.getUserMemberships()"/>
          </p>
          <p v-else>No enrolment url has been configured, please configure it</p>
        </el-row>
        <br/>
        <br/>
      </el-row>
      <el-row v-else>
        <p class="flex flex-col items-center" v-if="this.enrollmentUrl">
          <router-link v-if="isLoginEnabled" to="/login">
            <el-button>Sign up or Login</el-button>
          </router-link>
        </p>
      </el-row>
    </el-row>
    <el-row>
      <br/><br/>
    </el-row>
    <el-row :justify="'center'">
      Contact:&nbsp;
      <a class="underline" :href="'mailto: '+ emailHelp">{{ emailHelp }}</a>
    </el-row>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">Close</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>

import {
  tokenSessionKey,
  removeLocalStorage,
  getLocalStorage
} from "@/storage";

export default {
  props: ['dialogVisible', 'enrollmentUrl', 'enrollmentLabel', 'enrollmentClass'],
  methods: {
    closeDialog() {
      this.$emit('close');
    },
    async getUserMemberships() {
      this.loading = true;
      const response = await this.$http.get({route: "/auth/memberships"});
      if (response.status !== 200) {
        delete this.$store.state.user;
        removeLocalStorage({key: tokenSessionKey});
        removeLocalStorage({key: 'isLoggedIn'});
        await this.$router.push("/login");
        this.loading = false;
      } else {
        const {memberships} = await response.json();
        this.memberships = memberships;
        //TODO: make it nicer, not reload!
        this.$router.go(this.$router.currentRoute);
        this.loading = false;
      }
    }
  },
  data() {
    return {
      loading: false,
      isLoginEnabled: this.$store.state.configuration.ui.login.enabled,
      isLoggedIn: false,
      emailHelp: this.$store.state.configuration.ui.email.help || 'add-email@example.com',
    }
  },
  watch: {
    //lazy watcher to detect if it has been emptied and its not freshly mounted
    //TODO: not sure if we need both watchers and mounted to checkIfLoggedIn
    '$store.state.user': {
      async handler() {
        this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
      },
      flush: 'post',
      immediate: true
    }
  }
}
</script>
