<template>
  <!-- component -->
  <div class="min-h-screen p-6 bg-gray-200 flex justify-center">
    <div class="container max-w-screen-lg mx-auto">
      <div>
        <h2 class="font-semibold text-xl text-gray-600">Help</h2>
        <p class="text-gray-500 mb-6">{{ help }}</p>

      </div>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      help: this.$store.state.configuration.ui.help.mainText,
    }
  },
  mounted() {
  }
};
</script>
