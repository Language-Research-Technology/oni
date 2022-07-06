<template>
  <!-- component -->
  <span v-show="!this.isLoggedIn">
    <button>
      <router-link to="/login">
        <h1 class="pl-8 lg:pl-0 text-gray-700">Login</h1>
      </router-link>
    </button>
  </span>
  <el-dropdown v-show="this.isLoggedIn" :hide-on-click="true">
    <span class="el-dropdown-link">
      <h1 class="pl-8 lg:pl-0 text-gray-700 text-base">{{ this.userName }}&nbsp;<i class="far fa-1x fa-user"></i>
      <el-icon class="el-icon--right"><arrow-down/></el-icon>
      </h1>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item>
          <button class="underline" @click="this.logout()">
            Logout
          </button>
        </el-dropdown-item>
        <el-dropdown-item divided>
          <ul class="bg-transparent">
            <li>Memberships:</li>
            <li v-for="uM of userMemberships">
              {{ uM }}
            </li>
          </ul>
        </el-dropdown-item>
        <el-dropdown-item divided>
          <router-link to="/user">
            <button class="underline">more...</button>
          </router-link>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
<script>

import {
  tokenSessionKey,
  removeLocalStorage,
  getLocalStorage
} from "@/storage";
import {ArrowDown} from '@element-plus/icons-vue'

export default {
  name: 'NavUser',
  components: {
    ArrowDown
  },
  data() {
    return {
      user: '',
      userName: '',
      userMemberships: [],
      isLoggedIn: false
    };
  },
  computed: {
    current: async function () {
      return this.$route.path;
    }
  },
  watch: {
    //lazy watcher to detect if it has been emptied and its not freshly mounted
    //TODO: not sure if we need both watchers and mounted to checkIfLoggedIn
    '$store.state.user': {
      async handler() {
        console.log('testing is logged in');
        console.log(getLocalStorage({key: 'isLoggedIn'}));
        this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
      },
      flush: 'post',
      immediate: true
    }
  },
  mounted() {
    this.$nextTick(async function () {
      this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
      await this.getUser();
      await this.getUserMemberships();
    });
  },
  methods: {
    async logout() {
      await this.$router.push("/logout");
    },
    async getUser() {
      const response = await this.$http.get({route: "/user"});
      const {user} = await response.json();
      this.user = user;
      this.setName()
      this.provider = user['provider'];
    },
    setName() {
      if (this.user['name']) {
        if (this.user['name'].length > 30) {
          this.userName = this.user['name'].substring(0, 30) + '...';
        } else {
          this.userName = this.user['name'];
        }
      } else {
        this.userName = 'Welcome';
      }
    },
    async getUserMemberships() {
      this.loading = true;
      const response = await this.$http.get({route: "/auth/memberships"});
      const {memberships} = await response.json();
      for (let m of memberships) {
        if (m['group']) {
          this.userMemberships.push(m['group']);
        }
      }
    }
  }
};
</script>
