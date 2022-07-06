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
          <nav-user/>
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
import NavUser from './NavUser.component.vue';

export default {
  name: 'NavView',
  components: {
    NavUser,
  },
  data() {
    return {};
  },
  computed: {
    current: async function () {
      return this.$route.path;
    }
  },
  watch: {},
  mounted() {
  },
  methods: {}
};
</script>
