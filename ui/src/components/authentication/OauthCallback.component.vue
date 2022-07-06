<template>
  <div class="flex items-center justify-center py-32">
    <div class="bg-gray-200 w-96 rounded-lg py-8 flex flex-col items-center">
      <el-row class="h-32 items-center" align="middle">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <p v-loading="loading"></p>
        </el-col>
        <el-col class="flex flex-col items-center" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <p>{{ loadingText }}</p>
          <br/>
          <p v-if="goHome">
            <el-link href="/login">Login</el-link>
          </p>
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
      loadingText: 'Loading...',
      goHome: false
    };
  },
  mounted() {
    this.login();
  },
  methods: {
    async login() {
      try {
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
            const getMemberships = await this.$http.get({route: "/auth/memberships"});
            const {memberships} = await getMemberships.json();
            //TODO: do smarter membership checks
            //If user is not enrolled need to send it to enrollmentURL if configured
            if (memberships.length === 0 && this.$store.state.configuration.ui.enrollment.enforced) {
              this.loadingText = 'Please enroll first';
              window.location.href = this.$store.state.configuration.ui.enrollment.URL;
            } else {
              let lastRoute = getLocalStorage({key: 'lastRoute'});
              if (lastRoute) {
                removeLocalStorage({key: 'lastRoute'});
                await this.$router.push(lastRoute);
              } else {
                await this.$router.push("/");
              }
            }
            this.loading = false;
          } catch (e) {
            this.loading = false;
            console.log(e);
          }
        }
      } catch (e) {
        this.loadingText = 'there was an error login you in, please try again';
        this.goHome = true;
        this.loading = false;
        console.error(e);
      }
    },
  },
};
</script>
