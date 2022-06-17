<template>
  <div class="flex items-center justify-center py-32">
    <div class="w-96 h-32 rounded-lg pt-8 pb-8 px-8 flex flex-col items-center"
         v-loading="loading"
         :element-loading-text="loadingText"
         element-loading-background="rgba(229, 231, 235, 0.5)"
         >
    </div>
  </div>
  <footer/>
</template>

<script>
import {
  loginSessionKey,
  tokenSessionKey,
  putLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from "@/storage";

export default {
  data() {
    return {
      error: false,
      loading: true,
      loadingText: 'Loading...'
    };
  },
  mounted() {
    this.login();
  },
  methods: {
    async login() {
      this.loadingText = 'Logging you in';
      let {code_verifier} = getLocalStorage({key: loginSessionKey});
      removeLocalStorage({key: loginSessionKey});
      let response = await this.$http.post({
        route: `/oauth/${this.$route.query.state}/code`,
        body: {code: this.$route.query.code, state: this.$route.query.state, code_verifier},
      });
      if (response.status !== 200) {
        this.error = true;
        this.$store.commit("setIsLoggedIn", false);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.$router.push("/login");
        this.loading = false;
      } else {
        try {
          this.loadingText = 'Checking memberships';
          let {token} = await response.json();
          let user = JSON.parse(atob(token.split(".")[1]));
          this.$store.commit("setUserData", user);
          this.$store.commit("setIsLoggedIn", true);
          putLocalStorage({key: tokenSessionKey, data: {token}});
          this.loading = false;
          await this.$http.get({route: "/auth/memberships"});
          await this.$router.push("/");
        } catch (e) {
          this.loading = false;
          console.log(e);
        }
      }
    },
  },
};
</script>
