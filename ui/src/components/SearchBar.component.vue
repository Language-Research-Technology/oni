<template>
  <el-row :offset="1" :gutter="40" :align="'middle'" class="p-4">
    <el-col :xs="24" :sm="9" :md="8" :lg="5" :xl="4" class="px-2 pr-4 pb-4 max-w-0 h-auto">
      <el-row :justify="'center'" :align="'middle'">
        <p class="font-light">{{ siteName }}<span class='font-bold'>{{ siteNameX }}</span></p>
      </el-row>
    </el-col>
    <el-col :xs="24" :sm="15" :md="16" :lg="19" :xl="20" class="px-4 pr-4 max-w-0 h-auto">
      <el-row :justify="'center'" :gutter="20" :align="'middle'" class="">
        <label for="search_input" class="">
        <input @keyup.enter="this.doSearch()" type="text" class="px-4 py-2 w-80 border rounded" placeholder="Search..."
               v-model="searchQuery"
               v-on:change="searchInputField"
               name="search_input" id="search_input"/>
        <button tabindex="-1"
                class="border-r cursor-pointer outline-none focus:outline-none transition-all text-gray-300 hover:text-red-600">
          <svg @click="this.reset()" class="w-4 h-4 mx-2 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        </label>
        <button @click="this.doSearch()" class="flex items-center justify-center px-2 rounded hover:text-red-600">
          <svg class="w-6 h-6 text-gray-600" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 24 24">
            <path
                d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
          </svg>
        </button>
      </el-row>
    </el-col>
  </el-row>
</template>

<script>

import {defineAsyncComponent} from 'vue';
import {first, isEmpty} from 'lodash';

export default {
  props: ['searchInput', 'clearSearch'],
  components: {
    DocElement: defineAsyncComponent(() =>
        import('./DocElement.component.vue')
    )
  },
  updated() {
    // console.log('updated')
    // console.log(this.searchInput)
    //this.searchQuery = this.searchInput;
  },
  mounted() {
    //TODO: change this to configuration so search can go to X page
    if (this.$route.path === '/search') {
      this.search();
    }
    this.$emit('input', this.searchQuery)
  },
  watch: {
    clearSearch() {
      this.reset();
    }
  },
  methods: {
    reset() {
      this.searchQuery = '';
      this.$emit('input', this.searchQuery);
    },
    searchInputField(e) {
      //TODO: change this to configuration so it can update X route
      if (this.$router.path === 'search') {
        this.searchQuery = e.target.value;
        const query = {...this.$router.query, q: e.target.value};
        this.$router.replace({query});
      }
      this.$emit('input', this.searchQuery)
    },
    async search() {
      if (!isEmpty(this.searchQuery)) {
        await this.doSearch();
      } else if (!isEmpty(this.$route.query.q)) {
        this.searchQuery = this.$route.query.q;
        await this.doSearch();
      } else if (isEmpty(this.searchQuery)) {
        await this.doSearch()
      }
    },
    async doSearch() {
      let response;
      if (this.searchQuery) {
        await this.$router.push({path: 'search', query: {q: this.searchQuery}});
        response = await this.$http.get({route: `/search/items?multi=${this.searchQuery}`});
      } else {
        await this.$router.push({path: 'search'});
        response = await this.$http.get({route: '/search/items'});
      }
      this.items = await response.json();
      this.$emit('populate', {items: this.items, newSearch: true});
    }
  },
  data() {
    return {
      siteName: this.$store.state.configuration.ui.siteName,
      siteNameX: this.$store.state.configuration.ui.siteNameX || '',
      searchQuery: '',
      items: [],
      scrollId: ''
    }
  }
}
</script>
