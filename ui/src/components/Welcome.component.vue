<template>
  <div class="h-screen">
    <nav-foot/>
    <search-bar @populate='populate' :searchInput="searchInput"/>
    <!--    <div class="bg-white w-full flex items-center justify-center">-->
    <!--      <div class="flex rounded p-3 m-4 ">-->
    <!--        <input @keyup.enter="this.search()" type="text" class="px-4 py-2 w-80 border rounded" placeholder="Search..."-->
    <!--               v-model="searchInput">-->
    <!--        <button @click="this.search()" class="flex items-center justify-center px-4 border-l rounded">-->
    <!--          <svg class="w-6 h-6 text-gray-600" fill="currentColor" xmlns="http://www.w3.org/2000/svg"-->
    <!--               viewBox="0 0 24 24">-->
    <!--            <path-->
    <!--                d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>-->
    <!--          </svg>-->
    <!--        </button>-->
    <!--      </div>-->
    <!--    </div>-->
    <div class="flex justify-center items-center bg-indigo-100">
      <div v-if="this.items.length > 0" class="flex justify-between">
        <div class="w-1/4 pt-4">
          <div class="flex w-full" v-for="(aggs, aggsName) of aggregations" :key="aggsName">
            <ul v-if="aggs?.values?.buckets?.length > 0" class="bg-white rounded pb-4 pl-2 pr-2 m-2 ml-6 shadow-md">
              <li class="border-b-2">
                <button
                    class="m-2 text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggsName.toUpperCase() }}
                </button>
              </li>
              <li class="m-2 mt-4" v-for="ag of aggs?.values?.buckets">
                <button @click="this.facet(aggsName, ag)"
                        class="text-gray-600 dark:text-gray-300 font-semibold py-1 px-2 border border-gray-400 rounded shadow-md hover:bg-gray-100">
                  {{ ag.key }} | {{ ag.doc_count }}
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div class="w-3/4 pt-4">
          <div v-for="item of this.items" class="flex">
            <div class="w-full h-auto rounded-lg m-2 pb-4 pr-4 flex flex-col items-center">
              <a :href="'/view?id=' + encodeURIComponent(item._source['@id'])"
                 class="w-full block p-5 max-w-screen-md bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {{ first(item._source.name)?.['@value'] || first(first(item._source.identifier)?.value)?.['@value'] }}
                </h5>
                <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">{{ item.conformsTo }}</p>
                <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
                  <span v-if="item._source._contains?.['@type'].length > 0">Contains:&nbsp;</span>
                  <span v-for="type of item._source._contains?.['@type']">{{ type }}</span>
                </p>
                <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
                  <span v-if="item._source._contains?.['language'].length > 0">Languages:&nbsp;</span>
                </p>
                <div class="flex flex-wrap">
                  <button
                      class="text-sm px-2 pb-1 pt-1 m-2 text-gray-400 dark:text-gray-300 border border-gray-300 rounded shadow"
                      v-for="language of item._source._contains?.['language']">{{
                      first(language.name)?.['@value']
                    }}
                  </button>
                </div>
                <p v-if="item._source?.memberOf"> Related: {{ first(item._source?.memberOf)?.['@id'] }}</p>
                <ul v-if="item.highlight">
                  <li v-for="highlight of item.highlight"
                      v-html="wrapHighlight(first(highlight))"></li>
                </ul>
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
      </div>
      <div v-if="this.items.length <= 0"
           class="w-full h-auto rounded-lg p-4 m-4 flex justify-center ">
        <p class="bg-white rounded p-4 m-4 shadow-md">
          No items were found with that search input
        </p>
      </div>
    </div>
  </div>
</template>

<script>

import 'element-plus/theme-chalk/display.css'
import {first} from 'lodash';
import NavFoot from './NavFoot.component.vue';
import {defineAsyncComponent} from "vue";

export default {
  components: {
    NavFoot,
    SearchBar: defineAsyncComponent(() =>
        import("@/components/SearchBar.component.vue")
    ),
  },
  data() {
    return {
      searchInput: '',
      items: [],
      more: false,
      aggregations: {}
    };
  },
  async mounted() {
    if (this.$route.query.search) {
      this.searchInput = this.$route.query.search;
      this.items = []
    } else {
      this.searchInput = '';
      this.items = []
    }
    console.log('welcome mounted')
    console.log(this.items);
    // if (this.$route.query.search) {
    //   const searchQuery = this.$route.query.search;
    //   this.searchInput = searchQuery;
    // }
    // if (this.$route.path === "/") this.$router.push("/welcome");
    // let response;
    // if (this.searchInput) {
    //   response = await this.$http.get({route: `/search/items?multi=${this.searchInput}`});
    // } else {
    //   response = await this.$http.get({route: '/search/items'});
    // }
    // const items = await response.json();
    // this.populate(items);
  },
  methods: {
    first,
    async facet(name, ag) {
      console.log('facet')
      console.log(name)
      console.log(ag)
      const input = this.searchInput;
      let response = await this.$http.get({route: `/search/items?multi=${input}`});
      const items = await response.json();
      this.items = [];
      this.scrollId = null;
      this.populate(items);
    },
    populate({items, scrollId, newSearch}) {
      if (newSearch) {
        this.items = []
      }
      console.log('populate!')
      if (items['_scroll_id']) {
        this.scrollId = items['_scroll_id'];
      }
      if (items['hits']) {
        const thisItems = items['hits']['hits'];
        if (thisItems.length > 0) {
          for (let item of thisItems) {
            this.items.push(item);
          }
          this.more = true;
        } else {
          this.more = false;
        }
      }
      if (items['aggregations']) {
        this.aggregations = items['aggregations'];
      }
    },
    async getNext() {
      let response = await this.$http.get({route: `/search/items?scroll=${this.scrollId}`});
      const items = await response.json();
      this.populate({items});
    },
    wrapHighlight(text) {
      return '... ' + text + ' ...';
    }
  }
};
</script>
