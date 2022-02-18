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
export default {
  props: ['aggsName', 'buckets'],
  methods: {
    clear() {
      this.checkedBuckets = [];
    },
    async onChange() {
      if (this.$route.query.f) {
        const filters = this.$route.query.f;
        let decodedFilters = decodeURIComponent(filters);
        const queryFilters = JSON.parse(decodedFilters);
        console.log(queryFilters);
        for (let cB of this.checkedBuckets) {
          console.log(cB);
          if (!queryFilters[this.aggsName]) {
            queryFilters[this.aggsName] = [];
          }
          queryFilters[this.aggsName].push(cB);
        }
        console.log(queryFilters);
        const encodedFilters = encodeURIComponent(JSON.stringify(queryFilters));
        //TODO: emit filters to parent
        await this.$router.push({path: 'search', query: {f: encodedFilters}});
        console.log(encodedFilters);
      } else {
        const queryFilters = {};
        for (let cB of this.checkedBuckets) {
          console.log(cB);
          if (!queryFilters[this.aggsName]) {
            queryFilters[this.aggsName] = [];
          }
          queryFilters[this.aggsName].push(cB);
        }
        console.log(queryFilters);
        const encodedFilters = encodeURIComponent(JSON.stringify(queryFilters));
        console.log(encodedFilters)
        await this.$router.push({path: 'search', query: {f: encodedFilters}});
      }
      //this.$emit('selected', {checkedBuckets: this.checkedBuckets, id: this.aggsName});
    }
  },
  data() {
    return {
      checkedBuckets: []
    }
  }
}
</script>
