<template>
  <div class="w-full h-screen">
    <div class="flex justify-center bg-gray-200">
      <div class="h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center">
        <p class="font-light text-4xl mb-4">{{ siteName }}<span class='font-bold'>{{ siteNameX }}</span></p>
        <p class="text-right mb-4">{{ welcome }}</p>
      </div>
    </div>
    <div class="flex items-center justify-center bg-gray-200">
      <div class="flex border-2 rounded">
        <input @keyup.enter="this.search()" type="text" class="px-4 py-2 w-80" placeholder="Search..." v-model="searchInput">
        <button @click="this.search()" class="flex items-center justify-center px-4 border-l">
          <svg class="w-6 h-6 text-gray-600" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 24 24">
            <path
                d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
          </svg>
        </button>
      </div>
    </div>
    <div v-for="item of this.items" class="flex justify-center bg-gray-200">
      <div class="h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center">
        <a href="#"
           class="block p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
          <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{{ item.name }}</h5>
          <p class="font-normal text-gray-700 dark:text-gray-400">{{ item.conformsTo }}</p>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import 'element-plus/theme-chalk/display.css'

export default {
  data() {
    return {
      siteName: this.$store.state.configuration.ui.siteName,
      siteNameX: this.$store.state.configuration.ui.siteNameX || '',
      welcome: this.$store.state.configuration.ui.welcomeMessage,
      items: []
    };
  },
  async mounted() {
    if (this.$route.path === "/") this.$router.push("/welcome");
    let response = await this.$http.get({ route: '/search/items' });
    const items = await response.json();
    this.populate(items);
  },
  methods: {
    async search() {
      console.log(this.searchInput);
      const input = encodeURIComponent(this.searchInput);
      let response = await this.$http.get({ route: `/search/items?name=${input}` });
      const items = await response.json();
      this.items = [];
      this.populate(items);
    },
    populate(items){
      if (items['hits']) {
        const thisItems = items['hits']['hits'];
        for (let item of thisItems) {
          const theItem = {
            conformsTo: item['_source']['conformsTo'],
            name: item['_source']['name']
          }
          this.items.push(theItem);
        }
      }
    }
  }
};
</script>
