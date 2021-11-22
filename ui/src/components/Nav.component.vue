<template>
  <!-- component -->
  <div class="flex flex-col">
    <nav class="px-4 flex justify-between bg-white h-10 border-b-2">
      <!-- top bar left -->
      <ul class="flex items-center">
        <li class="h-6 w-6">
          <button>
            <router-link to="/welcome">
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
          <router-link to="/login">
            <button><h1 class="pl-8 lg:pl-0 text-gray-700">Analytics</h1></button>
          </router-link>
        </li>
        <li class="pr-6">
          <button>
            <router-link to="/login"><h1 class="pl-8 lg:pl-0 text-gray-700">Help Guides</h1></router-link>
          </button>
        </li>
        <li class="pr-6">
          <span>
            <button @click="this.logout()">
            <h1 class="pl-8 lg:pl-0 text-gray-700">Logout</h1>
          </button>
          </span>
          &nbsp;
          <span>
            <button>
              <router-link to="/login">
                <h1 class="pl-8 lg:pl-0 text-gray-700">Login</h1>
              </router-link>
            </button>
          </span>
        </li>
        <li class="h-5 w-5">
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
  loginSessionKey,
  tokenSessionKey,
  putLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from "@/components/storage";
import { isEmpty } from 'lodash';

export default {
  name: 'NavView',
  data() {
    return {
      isLoggedIn: false,
      isLoggedOf: false
    };
  },
  computed: {
    current: function () {
      return this.$route.path;
    }
  },
  mounted() {
    console.log(this.$store.state.user)
  },
  methods: {
    async logout() {
      console.log(`Logout: ${ this.$store.state.user }`);
      await this.$http.get({ route: "/logout" });
      removeLocalStorage({ key: tokenSessionKey });
      await this.$router.push('/welcome');
    }
  }
};
</script>
