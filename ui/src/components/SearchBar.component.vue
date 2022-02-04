<template>
  <div class="bg-white w-full flex items-center justify-center">
    <div class="flex rounded p-3 m-4 ">
      <input @keyup.enter="this.doSearch()" type="text" class="px-4 py-2 w-80 border rounded" placeholder="Search..."
             v-model="searchQuery"
             v-on:change="searchInputField">
      <button @click="this.doSearch()" class="flex items-center justify-center px-4 border-l rounded">
        <svg class="w-6 h-6 text-gray-600" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 24 24">
          <path
              d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>

import {defineAsyncComponent} from 'vue';
import {first, isEmpty} from 'lodash';

export default {
  props: {
    searchInput: ''
  },
  components: {
    DocElement: defineAsyncComponent(() =>
        import('./DocElement.component.vue')
    )
  },
  mounted() {
    //TODO: change this to configuration so search can go to X page
    if (this.$route.path === '/search') {
      this.search();
    }
    this.$emit('input', this.searchQuery)
  },
  methods: {
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
      console.log(this.$route.path);
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
      searchQuery: '',
      items: [],
      scrollId: ''
    }
  }
}
</script>
