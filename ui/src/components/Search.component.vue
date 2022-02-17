<template>
  <div class="min-w-full pb-4 pt-0 px-2 pl-4">
    <div class="sticky top-0 bg-white z-10">
      <search-bar ref='searchBar' @populate='populate' v-bind:searchInput="searchInput" @input="onInputChange"
                  @search="search" :clearSearch="clear" :filters="this.filters"/>
    </div>
    <el-row :gutter="40" :offset="1">
      <el-col :xs="24" :sm="9" :md="8" :lg="6" :xl="4" :span="4"
              class="pr-4 max-w-0 h-auto">
        <div class="sticky top-32 pt-8">
          <div class="flex w-full">
            <ul class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
              <li>
                <p class="text-center">Aggregations</p>
              </li>
              <li class="p-4">
                <hr class="divider divide-gray-500"/>
              </li>
              <li>
                <p class="text-center">
                  <el-button v-on:click="this.clearAggregations">CLEAR</el-button>
                </p>
              </li>
            </ul>
          </div>
          <div class="flex w-full" v-for="(aggs, aggsName) of aggregations" :key="aggsName">
            <ul class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
              <li class="border-b-2">
                <button class="m-2 text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggsName }}
                </button>
              </li>
              <li v-if="aggs?.buckets?.length <= 0" class="w-full min-w-full">&nbsp;</li>
              <search-aggs :buckets="aggs.buckets" :aggsName="aggsName" @selected="this.bucketSelected"
                           :ref="aggsName"/>
            </ul>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="15" :md="16" :lg="18" :xl="20" :span="20" :offset="0">
        <div class="sticky top-20 z-10 bg-white pb-5">
          <el-row v-if="totals" :align="'middle'">
            <div class="divide-solid divide-y-2 divide-red-700 py-4">
              <div>Found {{ this.totals['value'] || 0 }} results</div>
              <div></div>
            </div>
          </el-row>
          <el-row :align="'middle'">
            <el-button-group v-for="(filter, filterKey) of this.filters" :key="filterKey"
                             v-model="this.filters">
              <el-button color="#626aef" plain @click="this.clearFilterX({filter, filterKey})">
                {{ filter }}
                <el-icon class="el-icon--right">
                  <CloseBold/>
                </el-icon>
              </el-button>
            </el-button-group>
          </el-row>
        </div>
        <div v-for="item of this.items" class="z-0 mt-0 mb-4 w-full">
          <search-detail-element
              :id="item._source['@id']"
              :href="'/view?id=' + encodeURIComponent(item._source['@id'])"
              :name="first(item._source.name)?.['@value'] || first(first(item._source.identifier)?.value)?.['@value']"
              :conformsTo="item.conformsTo"
              :types="item._source?.['@type']"
              :languages="item._source?.['language']"
              :memberOf="item._source?.memberOf"
              :highlight="item?.highlight"
              :root="item._source?._root"
          />
        </div>
        <div v-if="!this.items.length > 0">
          <el-row class="pb-4 items-center">
            <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
              No items were found with that search input
            </h5>
          </el-row>
          <el-row>
            <p class="text-center">
              <el-button type="primary" v-on:click="this.resetSearch">RESTART SEARCH</el-button>
            </p>
          </el-row>
        </div>
        <el-row :gutter="2" v-if="this.more" class="flex justify-center p-6">
          <el-button @click="getNext()"><i class="fa fa-arrow-alt-circle-down"></i>&nbsp;VIEW MORE
          </el-button>
        </el-row>

      </el-col>
    </el-row>
  </div>
</template>

<script>

import {omit, first, isEmpty} from 'lodash';
import {CloseBold} from "@element-plus/icons-vue";
import {toRaw, defineAsyncComponent} from "vue";
import SearchDetailElement from './SearchDetailElement.component.vue';
import SearchAggs from './SearchAggs.component.vue';

export default {
  components: {
    SearchDetailElement,
    SearchAggs,
    CloseBold,
    SearchBar: defineAsyncComponent(() =>
        import("@/components/SearchBar.component.vue")
    )
  },
  data() {
    return {
      searchInput: '',
      items: [],
      totals: {},
      more: false,
      aggregations: {},
      filters: {},
      clear: false,
      filterButton: []
    };
  },
  updated() {
    // console.log(`Search Input: ${this.searchInput}`);
    // console.log(`Search Query: ${this.$route.query.q}`);
  },
  watch: {
    '$route.query.filters'() {
      this.updateFilters();
    }
  },
  async mounted() {
    const q = this.$route.query.q;
    console.log(q)
    this.updateFilters()
  },
  methods: {
    first,
    updateFilters() {
      try {
        if (this.$route.query.filters) {
          const filters = decodeURIComponent(this.$route.query.filters);
          const filterQuery = JSON.parse(filters);
          for (let [key, val] of Object.entries(filterQuery)) {
            this.filters[key] = val;
          }
          this.$emit('selected', this.filters);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async clearFilterX({filter, filterKey}) {
      console.log({filter, filterKey});
      this.filters = omit(this.filters, filterKey);
      console.log(toRaw(this.filters));
      this.$route.query.filters = encodeURIComponent(this.filters);
      await this.$router.push({path: 'search', query: {q: this.$route.query.q}});
      await this.search()
    },
    async bucketSelected({checkedBuckets, id}) {
      // this.filters[id] = checkedBuckets.map((k) => {
      //   return {key: k}
      // });
      this.filters[id] = checkedBuckets;
      console.log(this.filters);
      await this.search();
    },
    populate({items, scrollId, newSearch}) {
      console.log(toRaw(items));
      if (newSearch) {
        this.items = [];
        this.scrollToTop();
      }
      if (items['_scroll_id']) {
        this.scrollId = items['_scroll_id'];
      }
      if (items['hits']) {
        const thisItems = items['hits']['hits'];
        this.totals = items['hits']['total'];
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
        this.aggregations = this.populateAggregations(items['aggregations']);
      }
    },
    populateAggregations(aggregations) {
      const a = {};
      for (let agg of Object.keys(aggregations)) {
        a[agg] = {
          buckets: aggregations[agg]?.buckets || aggregations[agg]?.values?.buckets
        };
      }
      return a;
    },
    async getNext() {
      let response = await this.$http.get({route: `/search/items?scroll=${this.scrollId}`});
      const items = await response.json();
      this.populate({items});
    },
    onInputChange(value) {
      this.searchInput = value;
    },
    async resetSearch() {
      this.clear = !this.clear;
      this.searchInput = '';
      this.$route.query.q = '';
      this.filterButton = [];
      await this.$router.push({path: 'search', query: {q: ''}});
      let response = await this.$http.get({route: `/search/items`});
      const items = await response.json();
      this.populate({items, newSearch: true});
    },
    scrollToTop() {
      //TODO: smooth scroll please
      window.scrollTo(0, 0);
    },
    async clearAggregations() {
      for (let agg of Object.keys(this.aggregations)) {
        //TODO: ask cos this may be silly?!?
        //this.$refs[agg][0].clear();
        for (let r of this.$refs[agg]) {
          r.clear();
        }
      }
      this.filters = {};
      await this.resetSearch();
    },
    async search(input) {
      if (input) {
        this.searchQuery = input;
      } else {
        this.searchQuery = this.$route.query.q || '';
      }
      let searchRoute;
      if (this.searchQuery) {
        searchRoute = `/search/items?multi=${this.searchQuery}`;
        if (!isEmpty(this.filters)) {
          let filters = JSON.stringify(this.filters);
          searchRoute += `&filters=${encodeURIComponent(filters)}`;
        }
      } else {
        searchRoute = `/search/items`;
        if (!isEmpty(this.filters)) {
          let filters = toRaw(this.filters)
          filters = JSON.stringify(filters);
          searchRoute += `?filters=${encodeURIComponent(filters)}`;
        }
      }
      let response = await this.$http.get({route: searchRoute});
      this.items = await response.json();
      this.populate({items: this.items, newSearch: true});
    }
  }
};
</script>
