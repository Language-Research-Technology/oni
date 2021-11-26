<template>
  <div class="w-full h-screen flex justify-center bg-gray-200">
    <div class="h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center">
      <p class="font-light text-4xl mb-4">{{ siteName }}<span class='font-bold'>{{ siteNameX }}</span></p>
      <p class="text-right mb-4">{{ welcome }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      siteName: this.$store.state.configuration.ui.siteName,
      siteNameX: this.$store.state.configuration.ui.siteNameX || '',
      welcome: this.$store.state.configuration.ui.welcomeMessage,
    };
  },
  mounted() {
    if (this.$route.path === "/") this.$router.push("/welcome");
  }
};
</script>
