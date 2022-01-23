<template>
  <view-doc :title="'Document'" :crateId="this.crateId" :meta="this.metadata"/>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import { omitBy } from 'lodash';
import { defineAsyncComponent } from 'vue';

export default {
  components: {
    ViewDoc: defineAsyncComponent(() =>
        import('./ViewDoc.component.vue')
    )
  },
  data() {
    return {
      metadata: {}
    }
  },
  async mounted() {
    const id = encodeURIComponent(this.$route.query.id)
    const element = encodeURIComponent(this.$route.query.element);
    let route = `/search/items?id=${ id }`;
    if (element) {
      route += `&element=${ element }`;
    }
    console.log(`Sending route: ${route}`);
    let response = await this.$http.get({ route: route });
    const metadata = await response.json();
    this.populate(metadata);
    console.log(metadata);
  },
  methods: {
    populate(metadata) {
      if (metadata?._source) {
        this.crateId = metadata._source._crateId;
        this.metadata = omitBy(metadata._source, (value, key) => key.startsWith('_'));
      }
    }
  }
}
</script>
