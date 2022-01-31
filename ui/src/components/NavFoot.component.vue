<template>
  <div class="w-full bg-indigo-100">
    <div class="flex justify-center bg-indigo-100">
      <div class="h-auto rounded-lg p-7 flex flex-col items-center">
        <p class="font-light text-4xl mb-4">{{ siteName }}<span class='font-bold'>{{ siteNameX }}</span></p>
        <p class="text-right mb-4">{{ welcome }}</p>
      </div>
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
    }
  }
}
</script>
