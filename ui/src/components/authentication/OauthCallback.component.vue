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
      console.log(this.$route);
      let response = await this.$http.post({
        route: `${ this.$route.path }`,
        body: { code: this.$route.query.code, user: this.user, code_verifier },
      });
      if (response.status !== 200) {
        this.error = true;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.$router.push("/login");
      } else {
        try {
          let { user, token } = await response.json();
          console.log(user)
          console.log(token)
          this.$store.commit("setUserData", user);
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
