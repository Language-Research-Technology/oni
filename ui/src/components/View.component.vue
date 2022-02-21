<template>
  <search-bar @populate='populate' :searchInput="searchInput"/>
  <el-row :justify="'center'" v-if="this.metadata">
    <el-col :span="22" >
    <div class="py-4 sticky top-0 bg-white z-10">
      <el-row :align="'middle'"
              class="mb-2 text-2xl font-medium dark:text-white">
        <h5>{{ getTitle() }}</h5>
      </el-row>
    <hr class="divider divider-gray pt-2"/>
    </div>
    <view-doc :crateId="this.crateId" :meta="this.metadata" :root="this.root"/>
    </el-col>
  </el-row>
  <div v-else>
    <view-doc-error/>
  </div>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import {first} from 'lodash';
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
      metadata: null,
      parent: {}
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
        this.root = first(metadata._source._root);
        //TODO: Omit in the backend
        console.log(metadata._source);
        this.metadata = metadata._source;
        //this.metadata = omitBy(metadata._source, (value, key) => key.startsWith('_'));
        //console.log(this.metadata)
      }
    },
    getTitle() {
      const title = first(this.metadata['name'])?.['@value'];
      if (title) {
        this.title = title;
        return title;
      } else {
        return this.metadata['@id'];
      }
    }
  }
}
</script>
