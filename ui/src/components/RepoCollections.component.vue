<template>
  <div class="z-0 mt-0 mb-4 w-full" v-for="(item, index) of collections">
    <search-detail-element
        :id="item._source['@id']"
        :href="`/view?id=${encodeURIComponent(item._source['@id'])}&_crateId=${encodeURIComponent(first(item._source._crateId)?.['@value'])}`"
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
</template>
<script>

import {defineAsyncComponent} from 'vue';
import SearchDetailElement from './SearchDetailElement.component.vue';
import {first} from 'lodash';

export default {
  props: ['collections'],
  components: {
    first,
    SearchDetailElement
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
