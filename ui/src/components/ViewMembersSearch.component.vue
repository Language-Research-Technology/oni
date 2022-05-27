<template>
  <div v-if="this.total > 0">
    <el-row>
      <el-col :xs="24" :sm="9" :md="8" :lg="5" :xl="5">
        <h4 class="p-3 font-bold break-words">{{ this.conformsToName }}</h4>
      </el-col>
      <el-col :xs="24" :sm="15" :md="16" :lg="19" :xl="19">
        <h4 class="p-3 font-bold break-words">Total {{ this.total }}</h4>
      </el-col>
    </el-row>
    <el-row>
      <el-col :xs="24" :sm="9" :md="8" :lg="5" :xl="5">
        <h4 class="p-3 font-bold break-words">&nbsp;</h4>
      </el-col>
      <el-col :xs="24" :sm="15" :md="16" :lg="19" :xl="19">
        <div v-for="(value, name, i) in this.meta.slice(0, this.limitMembers)" :key="name">
          <el-link :href="'/view?id=' + encodeURIComponent(value._source['@id'])">{{ value._source.name[0]?.['@value'] || value._source['@id'] }}</el-link>
        </div>
        <el-link v-if="this.showMore" :href="setFacetUrl()">Show More</el-link>
      </el-col>
    </el-row>
  </div>
</template>


<script>

import {defineAsyncComponent} from 'vue';
import {isEmpty} from 'lodash';

export default {
  props: ['limitMembers', 'crateId', 'conformsTo', 'conformsToName'],
  components: {},
  async mounted() {
    try {
      await this.getMembersOf();
      this.setFacetUrl();
    } catch (e) {
      console.error(e);
    }
  },
  methods: {
    async getMembersOf() {
      let route = `/search/items?filters=`;
      const facet = JSON.stringify({
        '_memberOf.@id': [encodeURIComponent(this.crateId['@value'])],
        '@type': [this.conformsTo]
      });
      route = route + facet;
      let response = await this.$http.get({route: route});
      const items = await response.json();
      if (items?.hits?.hits.length > 0) {
        this.meta = items?.hits?.hits;
        this.total = items.hits?.total.value;
      }
      this.showMore = this.total > this.limitMembers;
    },
    setFacetUrl() {
      let route = '/search?f=';
      //TODO: define search facet value from parent ??
      const facet = JSON.stringify({
        '_memberOf.@id': [encodeURIComponent(this.crateId['@value'])],
        '@type': [this.conformsTo]
      });
      return route + facet;
    }
  },
  data() {
    return {
      total: 0,
      showMore: false,
      meta: []
    }
  }
}
</script>
