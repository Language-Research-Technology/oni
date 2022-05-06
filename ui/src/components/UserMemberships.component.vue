<template>
  <!-- component -->
  <div class="bg-white rounded shadow-lg p-4 px-4 md:p-8 mb-6">
    <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
      <div class="text-gray-600">
        <p class="font-medium text-lg">User Memberships</p>
        <p></p>
      </div>

      <div class="lg:col-span-2">
        <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
          <div class="md:col-span-5">
            <p class="p-1 m-1 text-center">Member of the following groups:</p>
            <br/>
            <ul v-loading="loading" class="divide-y-2 divide-gray-100">
              <li class="p-3" v-for="item in memberships" :key="item">
                {{ item.group }}
              </li>
            </ul>
          </div>
        </div>

        <div class="md:col-span-2">
          <label for="key">&nbsp;</label>
          <div class="h-10 flex rounded items-center mt-1">
            <input type="button" value="Check Memberships" id="key" name="key"
                   class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                   @click="this.getUserMemberships()"/>
          </div>
          <div class="h-10 flex mt-2">
            <p>Click 'Check Memberships' to update your group memberships</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>

import {
  logoutService
} from "@/services";

export default {
  data() {
    return {
      loading: false,
      memberships: []
    };
  },
  mounted() {
    this.$nextTick(async function () {
      await this.getUserMemberships();
    });
  },
  methods: {
    async getUserMemberships() {
      this.loading = true;
      const response = await this.$http.get({route: "/auth/memberships"});
      if(response.status !== 200) {
        logoutService();
        await this.$router.push("/login");
      } else {
        const {memberships} = await response.json();
        this.memberships = memberships;
      }
      this.loading = false;
    }
  }
};
</script>

<!--
TODO: Read
[VueJS 3](https://v3.vuejs.org/guide/introduction.html)
[Vue-router](https://next.router.vuejs.org/)
[Vuex (state management)](https://next.vuex.vuejs.org/)
[Font Awesome Icons](https://fontawesome.com/v5.15/icons?d=gallery&p=2&m=free)
[Element Plus UI Controls](https://element-plus.org/en-US/component/border.html)
[TailwindCSS - bootstrap on steroids](https://tailwindcss.com/docs)
-->
