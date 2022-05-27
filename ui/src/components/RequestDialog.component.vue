<template>
  <el-dialog v-model="dialogVisible" v-on:close="this.closeDialog()" title="Request Access" width="50%" draggable>
    <el-row :gutter="10" :justify="'center'">
      <el-row v-if="isLoggedIn">
        <el-row>
          <el-link v-if="this.enrollmentUrl" :href="this.enrollmentUrl" target="_blank">{{
              this.enrollmentLabel
            }}
          </el-link>
          <p v-else>No enrolment url has been configured, please configure it</p>
        </el-row>
        <br/>
        <br/>
      </el-row>
      <el-row v-else>
        <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
          <el-row>
            <el-link v-if="this.enrollmentUrl" :href="this.enrollmentUrl" target="_blank">{{
                this.enrollmentLabel
              }}
            </el-link>
            <p v-else>No enrolment url has been configured, please configure it</p>
          </el-row>
          <br/>
        </el-col>
        <el-col class="p-2"  v-if="!isLoggedIn" :xs="4" :sm="4" :md="4" :lg="4" :xl="4">
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
  props: ['dialogVisible', 'enrollmentUrl', 'enrollmentLabel'],
  methods: {
    closeDialog() {
      this.$emit('close');
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
