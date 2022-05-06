<template>
  <div class="w-full h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-gray-200 w-96 h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center">
      <p>You have successfully logged out</p>
    </div>
  </div>
</template>

<script>

import {
  logoutService
} from "@/services";

export default {
  data() {
    return {};
  },
  mounted() {
    this.$nextTick(async function () {
      await this.logout();
    });
  },
  methods: {
    async logout() {
      console.log(`Logout:`);
      console.log(this.$store.state.user)
      logoutService();
      await this.$http.get({route: "/logout"});
    }
  }
};
</script>
