<template>
  <div class="flex items-center justify-center py-32">
    <div class="bg-gray-200 w-96 rounded-lg py-8 flex flex-col items-center">
      <el-row class="h-32 items-center" align="middle">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >
          <p v-loading="loading"></p>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >
          <p class="items-center">{{ loadingText }}</p>
        </el-col>
      </el-row>
    </div>
  </div>
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
          debugger;
          await this.$http.get({route: "/auth/memberships"});
          await this.$router.push("/");

          this.loading = false;
        } catch (e) {
          this.loading = false;
          console.log(e);
        }
      }
    },
  },
};
</script>
