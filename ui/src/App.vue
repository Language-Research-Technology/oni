<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import { tokenSessionKey, getLocalStorage } from "@/storage";

export default {
  data() {
    return {};
  },
  mounted() {
    this.setup();
  },
  methods: {
    async setup() {
      // let isAuthed = await this.$http.get({ route: "/authenticated" });
      // if (isAuthed.status === 200) {
      //   let { token } = getLocalStorage({ key: tokenSessionKey });
      //
      //   let user = JSON.parse(atob(token.split(".")[1]));
      //   this.$store.commit("setUserData", user);
      // }
    },
  },
};
</script>
