<template>
  <!-- component -->
  <div class="flex flex-col">
    <nav class="px-4 flex justify-between bg-white h-10 border-b-2">
      <!-- top bar left -->
      <ul class="flex items-center">
        <li class="h-6 w-6">
          <button>
            <router-link to="/search">
              <h1 class="pl-8 lg:pl-0 text-gray-700"><i class="fa fa-home"></i></h1>
            </router-link>
          </button>
        </li>
      </ul>
      <ul class="flex items-center">
        <li></li>
      </ul>
      <!-- to bar right  -->
      <ul class="flex items-center">
        <li class="pr-6">
          <button>
            <router-link to="/help"><h1 class="pl-8 lg:pl-0 text-gray-700">Help</h1></router-link>
          </button>
        </li>
        <li class="pr-6">
          <span v-show="this.isLoggedIn">
            <button @click="this.logout()">
            <h1 class="pl-8 lg:pl-0 text-gray-700">Logout</h1>
          </button>
          </span>
          &nbsp;
          <span v-show="!this.isLoggedIn">
            <button>
              <router-link to="/login">
                <h1 class="pl-8 lg:pl-0 text-gray-700">Login</h1>
              </router-link>
            </button>
          </span>
        </li>
        <li class="h-5 w-5" v-show="this.isLoggedIn">
          <button>
            <router-link to="/user">
              <i class="far fa-1x fa-user"></i>
            </router-link>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>
<script>

import {
  tokenSessionKey,
  removeLocalStorage,
  getLocalStorage
} from "@/storage";

export default {
  name: 'NavView',
  data() {
    return {
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
    });
  },
  methods: {
    async logout() {
      await this.$router.push("/logout");
    }
  }
};
</script>
