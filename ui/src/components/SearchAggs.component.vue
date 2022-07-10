<template>
  <div>
    <li class="m-2 mt-4 cursor-pointer" v-for="ag of buckets">
      <div class="form-check form-check-inline cursor-pointer">
        <input :id="aggsName + '_' + ag.key" :name="aggsName + '_' + ag.key" v-model="checkedBuckets" v-on:change="onChange"
               class=" cursor-pointer form-check-input h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer"
               type="checkbox" :value="ag.key">
        <label class=" cursor-pointer form-check-label inline-block text-gray-800" :for="aggsName + '_' + ag.key">
          {{ ag.key }} <span
            class="text-xs rounded-full w-32 h-32 text-white bg-red-600 p-1">{{ ag['doc_count'] }}</span>
        </label>
      </div>
    </li>
  </div>
</template>
<script>

export default {
  props: ['aggsName', 'buckets'],
  watch: {
    '$route.query.f'() {
      this.updateFilters();
    }
  },
  async mounted() {
    await this.updateFilters();
  },
  methods: {
    clear() {
      this.checkedBuckets = [];
    },
    updateFilters() {
      if (this.$route.query.f) {
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
        for (const checkedBucket of this.checkedBuckets) {
          if (!queryFilters[this.aggsName]) {
            queryFilters[this.aggsName] = [];
          }
          queryFilters[this.aggsName].push(checkedBucket);
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
