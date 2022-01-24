<template>
  <div class="w-full h-screen bg-gray-200">
    <div class="flex justify-center bg-gray-200">
      <div class="h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center">
        <p class="font-light text-4xl mb-4">{{ siteName }}<span class='font-bold'>{{ siteNameX }}</span></p>
        <p class="text-right mb-4">{{ welcome }}</p>
      </div>
    </div>
    <div class="flex items-center justify-center bg-gray-200">
      <div class="flex border-2 rounded">
        <input @keyup.enter="this.search()" type="text" class="px-4 py-2 w-80" placeholder="Search..."
               v-model="searchInput">
        <button @click="this.search()" class="flex items-center justify-center px-4 border-l">
          <svg class="w-6 h-6 text-gray-600" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 24 24">
            <path
                d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="flex bg-gray-200">
      <div class="w-1/5"></div>
      <div class="w-3/4">
        <div v-for="item of this.items" class="flex">
          <div class="w-full h-auto rounded-lg pt-4 pb-4 px-4 flex flex-col items-center">
            <a :href="'/view?id=' + encodeURIComponent(item['@id'])"
               class="w-full block p-5 max-w-screen-md bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
              <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {{ first(item.name)?.['@value'] || first(first(item.identifier)?.value)?.['@value'] }}
              </h5>
              <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">{{ item.conformsTo }}</p>
              <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
                <span v-if="item._contains?.['@type'].length > 0">Contains:&nbsp;</span>
                <span v-for="type of item._contains?.['@type']">{{ type }}</span>
              </p>
              <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
                <span v-if="item._contains?.['language'].length > 0">Languages:&nbsp;</span>
                <span v-for="language of item._contains?.['language']">{{
                    first(language.name)?.['@value']
                  }} &nbsp;</span>
              </p>
              <p v-if="item?.memberOf"> Related: {{ first(item?.memberOf)?.['@id'] }}</p>
            </a>
          </div>
        </div>
        <div v-if="this.more" class="flex items-center justify-center">
          <button
              class="bg-white shadow bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
              @click="getNext()"><i class="fa fa-arrow-alt-circle-down"></i> More
          </button>
        </div>
        <div class="p-3 m-3"></div>
      </div>
      <div class="w-1/5"></div>
    </div>
  </div>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import { first } from 'lodash';

export default {
  data() {
    return {
      siteName: this.$store.state.configuration.ui.siteName,
      siteNameX: this.$store.state.configuration.ui.siteNameX || '',
      welcome: this.$store.state.configuration.ui.welcomeMessage,
      searchInput: '',
      items: [],
      more: false
    };
  },
  async mounted() {
    if (this.$route.path === "/") this.$router.push("/welcome");
    let response = await this.$http.get({ route: '/search/items' });
    const items = await response.json();
    this.populate(items);
  },
  methods: {
    first,
    async search() {
      const input = this.searchInput;
      let response = await this.$http.get({ route: `/search/items?multi=${ input }` });
      const items = await response.json();
      this.items = [];
      this.scrollId = null;
      this.populate(items);
    },
    populate(items) {
      if (items['_scroll_id']) {
        this.scrollId = items['_scroll_id'];
      }
      if (items['hits']) {
        const thisItems = items['hits']['hits'];
        if (thisItems.length > 0) {
          for (let item of thisItems) {
            this.items.push(item['_source']);
          }
          this.more = true;
        } else {
          this.more = false;
        }
      }
    },
    async getNext() {
      let response = await this.$http.get({ route: `/search/items?scroll=${ this.scrollId }` });
      const items = await response.json();
      this.populate(items);
    }
  }
};
</script>
