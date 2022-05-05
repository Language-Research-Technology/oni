<template>
  <div class="flex flex-col"></div>
</template>

<script>
import {
  loginSessionKey,
  tokenSessionKey,
  putLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from "@/components/storage";

export default {
  data() {
    return {
      error: false,
    };
  },
  mounted() {
    this.login();
  },
  methods: {
    async login() {
      let { code_verifier } = getLocalStorage({ key: loginSessionKey });
      removeLocalStorage({ key: loginSessionKey });
      let response = await this.$http.post({
        route: `/oauth/${this.$route.query.state}/code`,
        body: { code: this.$route.query.code, state: this.$route.query.state, code_verifier },
      });
      if (response.status !== 200) {
        this.error = true;
        this.$store.commit("setIsLoggedIn", false);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.$router.push("/login");
      } else {
        try {
          let { token } = await response.json();
          let user = JSON.parse(atob(token.split(".")[1]));
          this.$store.commit("setUserData", user);
          this.$store.commit("setIsLoggedIn", true);
          putLocalStorage({ key: tokenSessionKey, data: { token } });
          await this.$router.push("/");
        } catch (e) {
          console.log(e);
        }
      }
    },
  },
};
</script>
