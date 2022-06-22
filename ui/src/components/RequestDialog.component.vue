<template>
  <el-dialog v-model="dialogVisible" v-on:close="this.closeDialog()" title="Request Access" width="50%" draggable>
    <el-row :gutter="10" :justify="'center'">
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
        <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
          <el-row>
            <a v-if="this.enrollmentUrl" :href="this.enrollmentUrl"
               target="_blank" :class="this.enrollmentClass"
               :underline="false">{{
                this.enrollmentLabel
              }}
            </a>
            <p v-else>No enrolment url has been configured, please configure it</p>
          </el-row>
          <br/>
        </el-col>
        <el-col class="p-2" v-if="!isLoggedIn" :xs="4" :sm="4" :md="4" :lg="4" :xl="4">
          <el-divider direction="vertical"/>
        </el-col>
        <el-col v-if="!isLoggedIn" :xs="8" :sm="8" :md="8" :lg="8" :xl="8">
          <router-link to="/login">
            <el-button>Login</el-button>
          </router-link>
        </el-col>
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
        <el-button type="primary" @click="dialogVisible = false">Ok</el-button>
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
      } else {
        const {memberships} = await response.json();
        this.memberships = memberships;
        //TODO: make it nicer, not reload!
        location.reload();
      }
      this.loading = false;
    }
  },
  data() {
    return {
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
