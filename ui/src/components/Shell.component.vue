<template>
  <nav-view/>
  <router-view/>
  <footer-view/>
</template>

<script>
import NavView from './Nav.component.vue';
import FooterView from './Footer.component.vue';

export default {
  components: {
    NavView,
    FooterView
  },
  beforeMount() {
  },
  mounted() {
    //this.$store.dispatch("loadConfiguration");
    if (this.$route.path === "/") this.$router.push("/search");
  },
  data() {
    return {}
  },
};
</script>

