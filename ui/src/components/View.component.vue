<template>
  <search-bar @populate='populate' :searchInput="searchInput"/>
  <el-row :justify="'center'" v-if="this.metadata">
    <el-col :span="22">
      <div class="py-4 sticky top-0 bg-white z-10">
        <el-row :align="'middle'"
                class="mb-2 text-2xl font-medium dark:text-white">
          <h5>{{ getTitle() }}</h5>
        </el-row>
        <hr class="divider divider-gray pt-2"/>
      </div>
      <el-row v-if="this.isFile()">
        <el-col :xs="24" :sm="8" :md="8" :lg="5" :xl="4">
          <h4 class="p-3 font-bold break-words">&nbsp;</h4>
        </el-col>
        <el-col :xs="24" :sm="15" :md="16" :lg="19" :xl="16">
          <el-button :href="setGoToFileUrl()">Open File</el-button>
          <el-alert v-on:close="this.cannotOpenFile = false" title="Cannot Open File, request permissions or login"
                    type="error" v-if="this.cannotOpenFile"/>
        </el-col>
      </el-row>
      <view-doc :crateId="this.crateId" :meta="this.metadata" :root="this.root"/>
      <view-members v-if="this.conformsTo==='Collection'" :crateId="this.crateId" :limitMembers=10
                    :conformsTo="'https://github.com/Language-Research-Technology/ro-crate-profile%23Collection'"/>
      <view-members v-if="this.conformsTo==='Collection'" :crateId="this.crateId" :limitMembers=10
                    :conformsTo="'https://github.com/Language-Research-Technology/ro-crate-profile%23Object'"/>
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
    ViewMembers: defineAsyncComponent(() =>
        import('./ViewMembers.component.vue')
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
      parent: {},
      cannotOpenFile: false,
      conformsTo: ''
    }
  },
  async mounted() {
    try {
      const id = encodeURIComponent(this.$route.query.id)
      const element = encodeURIComponent(this.$route.query.element);
      let route = `/search/items?id=${id}`;
      //encodeURIComponent may return "undefined"
      if (element && element !== 'undefined') {
        route += `&element=${element}`;
      }
      console.log(`Sending route: ${route}`);
      let response = await this.$http.get({route: route});
      const metadata = await response.json();
      this.populate(metadata);
      this.setGoToFileUrl();
    } catch (e) {
      console.error(e);
    }
  },
  methods: {
    populate(metadata) {
      if (metadata?._source) {
        this.root = first(metadata._source._root);
        this.crateId = first(metadata._source._crateId);
        this.conformsTo = first(metadata._source.conformsTo)?.['@value'];
        console.log(this.conformsTo);
        //TODO: Omit in the backend
        console.log(metadata._source);
        //Deleting hasPart and hasMember. This will be done by quering the API
        delete metadata._source.hasPart;
        delete metadata._source.hasMember;
        this.metadata = metadata._source;
        //this.metadata = omitBy(metadata._source, (value, key) => key.startsWith('_'));
        //console.log(this.metadata)
      }
    },
    isFile() {
      const type = this.metadata['@type'];
      if (Array.isArray(type)) {
        return type.find((t) => t.toLowerCase() === 'file')
      } else if (typeof type === 'string') {
        return type.toLowerCase() === 'file';
      } else return false;
    },
    getTitle() {
      const title = first(this.metadata['name'])?.['@value'];
      if (title) {
        this.title = title;
        return title;
      } else {
        return this.metadata['@id'];
      }
    },
    setGoToFileUrl() {
      const crateId = this.crateId?.['@value'];
      const filePath = this.metadata?.['@id'];
      if (filePath && crateId) {
        const name = first(this.metadata.name)?.['@value'];
        const parent = first(this.metadata._parent);
        const parentId = parent['@id'];
        const parentName = first(parent['name'])?.['@value'];
        const url = '/open?id=' + encodeURIComponent(crateId) +
            '&path=' + encodeURIComponent(filePath) +
            '&title=' + encodeURIComponent(name) +
            '&parentId=' + encodeURIComponent(parentId) +
            '&parentTitle=' + encodeURIComponent(parentName);
        return url;
      } else {
        this.cannotOpenFile = true;
        return '';
      }
    }
  }
}
</script>
