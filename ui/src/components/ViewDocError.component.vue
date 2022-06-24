<template>
  <not-found-page :go="go"
                  :go_url="backUrl"
                  :not_found="'No Data Found'"
                  :not_found_message="' '"/>
</template>

<script>

import NotFoundPage from "./NotFoundPage.vue";

export default {
  components: {NotFoundPage},
  beforeMount() {
    if (window.history.length === 0) {
      this.backUrl = null;
      this.go = 'Go Home';
    } else {
      this.backUrl = this.$router.back;
    }
  },
  data() {
    console.log(this.$route)
    return {
      backUrl: '',
      go: 'Go Back'
    }
  }
}
</script>
