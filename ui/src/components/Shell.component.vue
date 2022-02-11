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

<!--
TODO: Read
[VueJS 3](https://v3.vuejs.org/guide/introduction.html)
[Vue-router](https://next.router.vuejs.org/)
[Vuex (state management)](https://next.vuex.vuejs.org/)
[Font Awesome Icons](https://fontawesome.com/v5.15/icons?d=gallery&p=2&m=free)
[Element Plus UI Controls](https://element-plus.org/en-US/component/border.html)
[TailwindCSS - bootstrap on steroids](https://tailwindcss.com/docs)
-->
