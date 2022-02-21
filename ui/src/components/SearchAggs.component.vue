<template>
  <div>
    <li class="m-2 mt-4 cursor-pointer" v-for="ag of buckets">
      <div class="form-check form-check-inline cursor-pointer">
        <input :id="ag.key" :name="ag.key" v-model="checkedBuckets" v-on:change="onChange"
               class=" cursor-pointer form-check-input h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer"
               type="checkbox" :value="ag.key">
        <label class=" cursor-pointer form-check-label inline-block text-gray-800" :for="ag.key">
          {{ ag.key }} <span
            class="text-xs rounded-full w-32 h-32 text-white bg-red-600 p-1">{{ ag['doc_count'] }}</span>
        </label>
      </div>
    </li>
  </div>
</template>
<script>
import {find} from 'lodash';

export default {
  props: ['aggsName', 'buckets'],
  watch: {
    '$route.query.f'() {
      console.log('search aggs: watching f');
      this.updateFilters();
    }
  },
  async mounted() {
    console.log('search aggs: mounted');
    await this.updateFilters();
  },
  methods: {
    clear() {
      this.checkedBuckets = [];
    },
    updateFilters() {
      console.log(this.checkedBuckets);
      if (this.$route.query.f) {
        console.log(this.$route.query.f);
        const filters = this.$route.query.f;
        let decodedFilters = decodeURIComponent(filters);
        const queryFilters = JSON.parse(decodedFilters);
        const qfFound = Object.keys(queryFilters).find((qF) => qF === this.aggsName);
        if (!qfFound) {
          this.checkedBuckets = [];
        } else {
          for (let [key, val] of Object.entries(queryFilters)) {
            if (key === this.aggsName) {
              this.checkedBuckets = val;
            }
          }
        }
      }
    },
    async onChange() {
      const query = {}
      if (this.$route.query.q) {
        query.q = this.$route.query.q
      }
      if (this.$route.query.f) {
        const filters = this.$route.query.f;
        let decodedFilters = decodeURIComponent(filters);
        const queryFilters = JSON.parse(decodedFilters);
        let checkedBuckets = [];
        if (this.checkedBuckets.length > 0) {
          for (let cB of this.checkedBuckets) {
            checkedBuckets.push(cB);
          }
        }
        queryFilters[this.aggsName] = checkedBuckets;
        const encodedFilters = encodeURIComponent(JSON.stringify(queryFilters));
        query.f = encodedFilters;
      } else {
        const queryFilters = {};
        for (let cB of this.checkedBuckets) {
          if (!queryFilters[this.aggsName]) {
            queryFilters[this.aggsName] = [];
          }
          queryFilters[this.aggsName].push(cB);
        }
        const encodedFilters = encodeURIComponent(JSON.stringify(queryFilters));
        query.f = encodedFilters;
      }
      await this.$router.push({path: 'search', query});
    }
  },
  data() {
    return {
      checkedBuckets: []
    }
  }
}
</script>
