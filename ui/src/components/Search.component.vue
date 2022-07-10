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
          <div class="flex w-full" v-for="aggs of aggregations" :key="aggs.name">
            <ul v-if="aggs?.buckets?.length > 0"
                class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
              <li class="border-b-2">
                <button class="m-2 text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggs.display }}
                </button>
              </li>
              <li v-if="aggs?.buckets?.length <= 0" class="w-full min-w-full">&nbsp;</li>
              <search-aggs :buckets="aggs.buckets" :aggsName="aggs.name" :ref="aggs.name"/>
            </ul>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="15" :md="16" :lg="18" :xl="20" :span="20" :offset="0" v-loading="this.loading">
        <div>
          <div class="sticky top-20 z-10 bg-white pb-5">
            <el-row v-if="totals" :align="'middle'">
              <div class="divide-solid divide-y-2 divide-red-700 py-4">
                <div v-if="this.totals['value'] > 0 && !this.isStart">
                  {{ this.collectionTotals }} Collection{{ this.collectionTotals === 1 ? '' : 's' }} with
                  {{ this.totals['value'] || 0 }} well described items
                </div>
                <div></div>
              </div>
            </el-row>
            <el-row :align="'middle'">
              <el-button-group v-for="(filter, filterKey) of this.filters" :key="filterKey"
                               v-model="this.filters">
                <el-button v-if="filter && filter.length > 0" v-for="f of filter" :key="f" color="#626aef" plain
                           @click="this.clearFilterX({f, filterKey})">
                  {{ f }}
                  <el-icon class="el-icon--right">
                    <CloseBold/>
                  </el-icon>
                </el-button>
              </el-button-group>
            </el-row>
          </div>
          <div v-if="this.isStart">
            <div v-if="this.showTopCollections">
              <top-collections :collections="this.collections"/>
              <el-row>
                <el-link v-if="this.collectionTotals > this.collections.length"
                         @click="getNextCollections(this.collectionScrollId);this.newSearch=false;">more collections
                </el-link>
              </el-row>
            </div>
          </div>

          <div v-if="this.showRepositoryCollections">
            <repo-collections :collections="this.collections"/>
            <el-row>
              <el-link v-if="this.collectionTotals > this.collections.length"
                       @click="getNextCollections(this.collectionScrollId);this.newSearch=false;">more collections
              </el-link>
            </el-row>
          </div>
          <el-row :align="'middle'">
            <div class="divide-solid divide-y-2 divide-red-700 py-4">
              <div>Items:</div>
              <div></div>
            </div>
          </el-row>
          <div v-for="item of this.items" class="z-0 mt-0 mb-4 w-full">
            <search-detail-element
                :id="item._source['@id']"
                :href="`/view?id=${encodeURIComponent(item._source['@id'])}&_crateId=${encodeURIComponent(first(item._source['_crateId'])?.['@value'])}`"
                :name="first(item._source.name)?.['@value'] || first(first(item._source.identifier)?.value)?.['@value']"
                :conformsTo="item.conformsTo"
                :types="item._source?.['@type']"
                :languages="item._source?.['language']"
                :_memberOf="item._source?._memberOf"
                :highlight="item?.highlight"
                :root="item._source?._root"
                :parent="item._source?._parent"
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
        </div>
      </el-col>
    </el-row>
  </div>
  <el-dialog v-model="errorDialogVisible" width="30%" center>
    <el-alert :title="this.errorDialogTitle" type="warning"
              :closable="false">
      <p class="break-normal">{{ this.errorDialogText }}</p>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="errorDialogVisible = false">Close</el-button>
      </span>
    </template>
  </el-dialog>
</template>


<script>

import {first, isEmpty, orderBy, toArray, find} from 'lodash';
import {CloseBold} from "@element-plus/icons-vue";
import {defineAsyncComponent, toRaw} from "vue";
import SearchDetailElement from './SearchDetailElement.component.vue';
import SearchAggs from './SearchAggs.component.vue';
import TopCollections from "./TopCollections.component.vue";
import RepoCollections from "./RepoCollections.component.vue";

export default {
  components: {
    TopCollections,
    RepoCollections,
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
      memberOfBuckets: [],
      filters: {},
      clear: false,
      filterButton: [],
      loading: false,
      top: {},
      showTopCollections: false,
      showRepositoryCollections: false,
      collections: [],
      collectionTotals: 0,
      collectionScrollId: '',
      isStart: false,
      newSearch: true,
      isBrowse: false,
      errorDialogVisible: false,
      errorDialogText: ''
    };
  },
  updated() {
  },
  watch: {
    async '$route.query'() {
      this.loading = true;
      if (this.$route.query.f) {
        await this.updateFilters();
      } else {
        await this.search();
      }
      await this.searchTopCollections();
      this.loading = false;
    }
  },
  async mounted() {
    this.loading = true;
    if (this.$route.query.f) {
      await this.updateFilters();
      //not await maybe all the routes can be not awaited?
      this.updateRoutes();
    } else {
      await this.search();
    }
    await this.searchTopCollections();
    this.loading = false;
  },
  methods: {
    toArray,
    first,
    async updateFilters() {
      try {
        if (this.$route.query.f) {
          const filters = decodeURIComponent(this.$route.query.f);
          const filterQuery = JSON.parse(filters);
          for (let [key, val] of Object.entries(filterQuery)) {
            this.filters[key] = val;
          }
          await this.search();
          //await this.updateRoutes();
        }
      } catch (e) {
        console.error(e);
      }
    },
    async clearFilterX({f, filterKey}) {
      if (this.filters[filterKey]) {
        this.filters[filterKey].splice(this.filters[filterKey].indexOf(f), 1);
      }
      await this.updateRoutes();
    },
    async updateRoutes() {
      let filters;
      const query = {q: this.$route.query.q}
      if (this.filters) {
        filters = toRaw(this.filters);
        filters = encodeURIComponent(JSON.stringify(filters));
        query.f = filters;
      }
      await this.$router.push({path: 'search', query, replace: true});
    },
    async bucketSelected({checkedBuckets, id}) {
      // this.filters[id] = checkedBuckets.map((k) => {
      //   return {key: k}
      // });
      this.filters[id] = checkedBuckets;
      await this.updateRoutes();
    },
    populate({items, scrollId, newSearch}) {
      if (newSearch) {
        this.items = [];
        this.newSearch = true;
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
        this.memberOfBuckets = items['aggregations']?.['_memberOf.name.@value'];
      }
    },
    populateAggregations(aggregations) {
      const a = {};
      //Note: below is converted to an ordered array not an object.
      for (let agg of Object.keys(aggregations)) {
        const aggInfo = this.$store.state.configuration.ui.aggregations;
        const info = aggInfo.find((a) => a['name'] === agg);
        const display = info?.display;
        const order = info?.order;
        const name = info?.name;
        a[agg] = {
          buckets: aggregations[agg]?.buckets || aggregations[agg]?.values?.buckets,
          display: display || agg,
          order: order || 0,
          name: name || agg
        };
      }
      return orderBy(a, 'order');
    },
    async getNext() {
      try {
        let response = await this.$http.get({route: `/search/items?scroll=${this.scrollId}`});
        const items = await response.json();
        this.populate({items});
      } catch (e) {
        this.errorDialogVisible = true;
        this.errorDialogText = 'Your search session has expired, please reload';
      }
    },
    onInputChange(value) {
      this.searchInput = value;
    },
    async resetSearch() {
      this.clear = !this.clear;
      this.searchInput = '';
      this.$route.query.q = '';
      this.$route.query.f = '';
      this.$route.query.t = '';
      this.filterButton = [];
      this.isStart = true;
      this.isBrowse = false;
      //this.filters = [];
      await this.searchAll();
    },
    async searchAll() {
      this.isStart = false;
      await this.$router.push({path: 'search'});
      let response = await this.$http.get({route: `/search/items`});
      const items = await response.json();
      this.populate({items, newSearch: true});
    },
    scrollToTop() {
      window.scrollTo({top: 0, behavior: 'smooth'});
    },
    async clearAggregations() {
      for (let agg of this.aggregations) {
        //TODO: ask cos this may be silly?!?
        //this.$refs[agg][0].clear();
        const name = agg?.name;
        if (this.$refs[name]) {
          for (let r of this.$refs[name]) {
            r.clear();
          }
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
    },
    async searchTopCollections() {
      const memberOfAgg = this.memberOfBuckets;
      const membersOf = toRaw(memberOfAgg?.buckets);
      const hasFilters = find(this.filters, f => f.length > 0);
      this.isStart = isEmpty(hasFilters) && isEmpty(this.searchQuery);
      if (membersOf && membersOf.length > 0) {
        this.top = {
          'name.@value': [...membersOf.map(e => e.key)],
          '@type': ['Dataset', 'RepositoryCollection']
        };
        if (this.isStart) {
          this.top['_isRoot.@value'] = ['true'];
          //TODO: change the routes to send types like the line below
          //this.top = {'_isRoot.@value': {v: ['true'], t: 'keyword'}};
        }
        this.top = JSON.stringify(this.top);
        await this.getNextCollections();
        if (this.collections.length > 0) {
          if (this.isStart && !this.isBrowse) {
            this.showTopCollections = true;
            this.showRepositoryCollections = false;
          } else {
            this.showRepositoryCollections = true;
            this.showTopCollections = false;
          }
        }
      }
    },
    async getNextCollections(scrollId) {
      let searchRoute = `/search/items`;
      searchRoute += `?filters=${encodeURIComponent(this.top)}`;
      if (scrollId) {
        searchRoute += `&scroll=${scrollId}`;
      }
      let response = await this.$http.get({route: searchRoute});
      const items = await response.json();
      this.collectionTotals = items?.['hits']?.['total']?.['value'];
      this.collectionScrollId = items?.['_scroll_id'];
      const thisItems = items?.['hits']?.['hits'];
      const rawItems = toRaw(thisItems);
      if (this.newSearch) {
        this.collections = orderBy(rawItems, '_source._isRoot');
      } else {
        this.collections = this.collections.concat(orderBy(rawItems, '_source._isRoot'));
      }
    },
  }
};
</script>
