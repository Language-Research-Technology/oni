<template>
  <div class="min-w-full pb-4 pt-0 px-2 pl-4">
    <div class="sticky top-0 bg-white z-10">
      <search-bar ref='searchBar' @populate='populate' v-bind:searchInput="searchInput" @input="onInputChange"
                  :clearSearch="clear"/>
    </div>
    <el-row :gutter="40" :offset="1">
      <el-col :xs="24" :sm="9" :md="8" :lg="6" :xl="4" :span="4"
              class="pr-4 max-w-0 h-auto">
        <div class="sticky top-20 pt-4">
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
                <button
                    class="m-2 text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggsName }}
                </button>
              </li>
              <li v-if="aggs?.buckets?.length <= 0"
                  class="w-full min-w-full">&nbsp;
              </li>
              <li class="m-2 mt-4" v-for="ag of aggs?.buckets">
                <div class="form-check form-check-inline">
                  <input v-bind:id="ag.key" v-on:change="updateSelectedCheckbox"
                         class="form-check-input h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer"
                         type="checkbox" :id="ag.key" :value="ag.key">
                  <label class="form-check-label inline-block text-gray-800" :for="ag.key">
                    {{ clean(ag.key) }} <span
                      class="text-xs rounded-full w-32 h-32 text-white bg-red-600 p-1">{{ ag.doc_count }}</span>
                  </label>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="15" :md="16" :lg="18" :xl="20" :span="20" :offset="0">
        <div class="sticky top-20 bg-white z-10">
          <p class="pt-8 pb-10">Found {{ this.totals['value'] || 0 }} Results</p>
          <hr class="divider divide-red-700 pt-2"/>
        </div>
        <div v-for="item of this.items" class="z-0 mt-0 mb-4 w-full">
          <search-detail-element
              :href="'/view?id=' + encodeURIComponent(item._source['@id'])"
              :name="clean(first(item._source.name)?.['@value']) || first(first(item._source.identifier)?.value)?.['@value']"
              :conformsTo="item.conformsTo"
              :types="item._source?.['@type']"
              :languages="item._source._contains?.['language']"
              :memberOf="item._source?.memberOf"
              :highlight="item?.highlight"
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
              <el-button type="primary" v-on:click="this.resetSearch">Start Over</el-button>
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

import {groupBy, first} from 'lodash';
import {toRaw, defineAsyncComponent} from "vue";
import SearchDetailElement from './SearchDetailElement.component.vue';

export default {
  components: {
    SearchDetailElement,
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
      filter: {},
      clear: false
    };
  },
  updated() {
    // console.log(`Search Input: ${this.searchInput}`);
    // console.log(`Search Query: ${this.$route.query.q}`);
  },
  async mounted() {
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
      console.log(toRaw(items));
      if (newSearch) {
        this.items = [];
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
      console.log(a);
      return a;
    },
    async getNext() {
      let response = await this.$http.get({route: `/search/items?scroll=${this.scrollId}`});
      const items = await response.json();
      this.populate({items});
    },
    clean(text) {
      //TODO: Do we want to do this? Just adding a space for each campital leter
      //return text.match(/([A-Z]?[^A-Z]*)/g).slice(0, -1).join(' ')
      return text;
    },
    onInputChange(value) {
      this.searchInput = value;
    },
    async resetSearch() {
      this.clear = !this.clear;
      this.searchInput = '';
      this.$route.query.q = '';
      await this.$router.push({path: 'search', query: {q: ''}});
      let response = await this.$http.get({route: `/search/items`});
      const items = await response.json();
      this.populate({items, newSearch: true});
    },
    async clearAggregations() {
      for (let ag in this.aggregations) {
        for (let v of this.aggregations[ag].buckets) {
          this.filter[v['key']] = {from: ag, key: v['key'], checked: false}
        }
      }
      await this.resetSearch();
      await this.selectAggregations();
    },
    async updateSelectedCheckbox(event) {
      const target = event.target.value;
      const isChecked = event.target.checked;
      for (let ag in this.aggregations) {
        for (let v of this.aggregations[ag].buckets) {
          if (v['key'] === target && isChecked) {
            this.filter[v['key']] = {from: ag, key: v['key'], checked: true}
          } else if (v['key'] === target && !isChecked) {
            this.filter[v['key']] = {from: ag, key: v['key'], checked: false}
          }
        }
      }
      await this.selectAggregations();
    },
    async selectAggregations() {
      const input = this.$route.query.q || '';
      const filter = toRaw(this.filter);
      const filterGroup = groupBy(filter, 'from');
      const filterIndex = []
      for (let f in filterGroup) {
        const keys = [];
        for (let e of filterGroup[f]) {
          keys.push({key: e.key, checked: e.checked});
        }
        filterIndex.push({field: f, keys: keys});
      }
      const fields = filterIndex.map((f) => f.field);
      let response = await this.$http.post({
        route: '/search/items',
        body: {multi: input, filter: filterIndex, fields: fields}
      });
      const items = await response.json();
      this.items = [];
      //this.aggregations = [];
      this.populate({items, newSearch: true});
    }
  }
};
</script>
