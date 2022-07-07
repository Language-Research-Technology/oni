<template>
  <el-row v-if="collections.length > 0">
    <div class="divide-solid divide-y-2 divide-red-700 py-4">
      <div>Top Collections</div>
      <div></div>
    </div>
  </el-row>
  <el-row :gutter="10" :align="'middle'" class="justify-center content-center">
    <el-col v-for="(c, index) of collections"
            :key="c"
            :span="10"
            :offset="0" class="m-2"
            :xs="24" :sm="24" :md="24" :lg="10" :xl="9">
      <el-card :body-style="{ padding: '2px' }" :class="'p-2'">
        <div style="padding: 14px">
          <el-row :gutter="0" class="h-28 max-h-28">
            <span class="text-2xl font-semibold h-full">{{ first(c._source.name)?.['@value'] }}</span>
          </el-row>
          <el-row class="h-28 max-h-28">
            <p class="h-full text-ellipsis overflow-scroll">{{ first(c._source['description'])?.['@value'] }}</p>
          </el-row>
          <el-row class="py-2">{{ c._source['_isRoot'] ? 'Top Collection' : '' }}</el-row>
          <el-row class="bottom justify-end" :gutter="0">
            <el-link :underline="false" :href="`/view?id=${c._source['@id']}&_crateId=${first(c._source['_crateId'])?.['@value']}`">
              <el-button type="default">Open</el-button>
            </el-link>
            <el-link :underline="false" :href="getFacet(c._source['@id'])">
              <el-button type="default">Search Children</el-button>
            </el-link>
          </el-row>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>
<script>

import {defineAsyncComponent} from 'vue';
import {first} from 'lodash';

export default {
  props: ['collections'],
  components: {
    first
  },
  async mounted() {
    console.log(this.collections)
  },
  methods: {
    first,
    getFacet(id) {
      let route = '/search?f=';
      const facet = JSON.stringify({'_memberOf.@id': [id]});
      return route + encodeURIComponent(facet)
    }
  },
  data() {
    return {}
  }
}
</script>
