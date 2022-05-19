<template>
  <div v-if="this.total > 0" class="md:container w-full">
    <el-row class="md:container w-full">
      <el-col :xs="24" :sm="9" :md="8" :lg="5" :xl="4">
        <h4 class="p-3 font-bold break-words">{{ this.conformsToName }}</h4>
      </el-col>
      <el-col :xs="24" :sm="15" :md="16" :lg="19" :xl="20">
        <h4 class="p-3 font-bold break-words">Total {{ this.total }}</h4>
      </el-col>
    </el-row>
    <el-row class="md:container w-full">
      <el-col :xs="24" :sm="9" :md="8" :lg="5" :xl="4">
        <h4 class="p-3 font-bold break-words">&nbsp;</h4>
      </el-col>
      <el-col :span="24" :xs="24" :sm="15" :md="16" :lg="19" :xl="20">
        <div class="md:container w-full" v-for="(value, name, i) in this.meta.slice(0, this.limitMembers)" :key="name">
          <el-link :href="'/view?id=' + value.crateId">{{ value.record.name || value.memberOf }}</el-link>
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
      const crateId = this.crateId;
      const conformsTo = this.conformsTo;
      const route = `/object?memberOf=${crateId['@value']}&conformsTo=${conformsTo}`;
      let response = await this.$http.get({route: route, doNotEncode: true});
      const metadata = await response.json();
      if (metadata) {
        this.meta = metadata.data;
        this.total = metadata.total;
      }
      this.showMore = this.total > this.limitMembers;
    },
    setFacetUrl() {
      let route = '/search?f=';
      //TODO: define search facet value from parent ??
      const facet = JSON.stringify({'_memberOf.@id': [this.crateId['@value']]});
      return route + encodeURIComponent(facet);
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
