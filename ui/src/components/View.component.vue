<template>
  <search-bar @populate='populate' :searchInput="searchInput" />

  <div v-if="this.metadata">
    <view-doc :crateId="this.crateId" :meta="this.metadata"/>
  </div>
  <div v-else>
    <view-doc-error/>
  </div>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import {omitBy, reject} from 'lodash';
import {defineAsyncComponent} from 'vue';

export default {
  components: {
    SearchBar: defineAsyncComponent(() =>
        import("@/components/SearchBar.component.vue")
    ),
    ViewDoc: defineAsyncComponent(() =>
        import('./ViewDoc.component.vue')
    ),
    ViewDocError: defineAsyncComponent(() =>
        import('./ViewDocError.component.vue')
    )
  },
  data() {
    return {
      searchInput: '',
      crateId: '',
      metadata: null
    }
  },
  async mounted() {
    const id = encodeURIComponent(this.$route.query.id)
    const element = encodeURIComponent(this.$route.query.element);
    let route = `/search/items?id=${id}`;
    if (element) {
      route += `&element=${element}`;
    }
    console.log(`Sending route: ${route}`);
    let response = await this.$http.get({route: route});
    const metadata = await response.json();
    this.populate(metadata);
  },
  methods: {
    populate(metadata) {
      if (metadata?._source) {
        this.crateId = metadata._source._crateId;
        //TODO: Omit in the backend
        console.log(metadata._source);
        this.metadata = metadata._source;
        //this.metadata = omitBy(metadata._source, (value, key) => key.startsWith('_'));
        //console.log(this.metadata)
      }
    }
  }
}
</script>
