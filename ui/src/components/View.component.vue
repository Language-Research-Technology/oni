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
      <el-button-group>
        <el-link v-if="this.searchRelated" :href="this.searchRelated" :underline="false">
          <el-button>Related Items
            <el-icon class="el-icon--right">
              <Switch/>
            </el-icon>
          </el-button>
        </el-link>
        <el-link v-if="this.parentLink" :href="this.parentLink" :underline="false">
          <el-button>Parent: {{ this.parentName || this.parentId }}</el-button>
        </el-link>
        <el-link v-if="this.isFile() && !this.cannotOpenFile" :href="this.fileUrl" :underline="false">
          <el-button>Preview File</el-button>
        </el-link>
        <el-link v-loading="this.loading" v-if="this.isFile() && !this.cannotOpenFile" :underline="false"
                 v-on:click="this.downloadFileUrl()">
          <el-button>Download</el-button>
        </el-link>
        <el-button v-if="this.notAuthorized" v-on:click="openRequestModal()">Request Access</el-button>
      </el-button-group>
      <view-doc :crateId="this.crateId" :meta="this.metadata" :root="this.root"/>
      <view-members v-if="getMembers()" :crateId="this.crateId" :limitMembers=10
                    :conformsToName="'Collections'"
                    :conformsTo="'https://github.com/Language-Research-Technology/ro-crate-profile%23Collection'"/>
      <view-members-search v-if="getMembers()" :crateId="this.crateId" :limitMembers=10
                           :conformsToName="'Repository Objects'" :conformsTo="'RepositoryObject'"/>
      <el-row>
        &nbsp;
      </el-row>

    </el-col>
  </el-row>
  <div v-else>
    <view-doc-error/>
  </div>
  <request-dialog :dialogVisible="this.openDocModal" v-on:close="this.openDocModal = false"/>
  <el-dialog v-model="errorDialogVisible" width="30%" center>
    <span>{{ this.errorDialogText }}</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="errorDialogVisible = false">Close</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import {Switch} from "@element-plus/icons-vue";
import {first} from 'lodash';
import {defineAsyncComponent} from 'vue';

export default {
  components: {
    Switch,
    RequestDialog: defineAsyncComponent(() =>
        import("@/components/RequestDialog.component.vue")
    ),
    SearchBar: defineAsyncComponent(() =>
        import("@/components/SearchBar.component.vue")
    ),
    ViewDoc: defineAsyncComponent(() =>
        import('./ViewDoc.component.vue')
    ),
    ViewMembers: defineAsyncComponent(() =>
        import('./ViewMembers.component.vue')
    ),
    ViewMembersSearch: defineAsyncComponent(() =>
        import('./ViewMembersSearch.component.vue')
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
      conformsTo: '',
      fileUrl: '',
      searchRelated: '',
      parentId: '',
      parentLink: '',
      parentName: '',
      error: '',
      notAuthorized: false,
      openDocModal: false,
      loading: false,
      errorDialogVisible: false,
      errorDialogText: ''
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
      this.setFacetUrl();
      this.setParentLink();
      this.getMembers();
    } catch (e) {
      this.errorDialogVisible = true;
      this.errorDialogTitle = 'Error';
      this.errorDialogText = e.message;
      this.loading = false;
      console.error(e);
    }
  },
  methods: {
    populate(metadata) {
      if (metadata?._source) {
        this.root = first(metadata._source._root);
        this.crateId = first(metadata._source._crateId);
        this.conformsTo = first(metadata._source.conformsTo)?.['@value'];
        this.error = metadata._source.error;
        this.setError();
        console.log(this.conformsTo);
        //TODO: Omit in the backend
        console.log(metadata._source);
        //Deleting hasPart and hasMember. This will be done by quering the API
        delete metadata._source.hasPart;
        delete metadata._source.hasMember;
        delete metadata._source.error;
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
      if (this.isFile()) {
        const crateId = this.crateId?.['@value'];
        const filePath = this.metadata?.['@id'];
        const parent = first(this.metadata?._parent);
        if (filePath && crateId && parent) {
          const name = first(this.metadata.name)?.['@value'];
          this.parentId = parent?.['@id'];
          this.parentName = first(parent['name'])?.['@value'];
          const url = '/open?id=' + encodeURIComponent(crateId) +
              '&path=' + encodeURIComponent(filePath) +
              '&title=' + encodeURIComponent(name) +
              '&parentId=' + encodeURIComponent(this.parentId) +
              '&parentTitle=' + encodeURIComponent(this.parentName);
          this.fileUrl = url;
        } else {
          this.cannotOpenFile = true;
          this.fileUrl = '';
        }
      }
    },
    async downloadFileUrl() {
      if (this.isFile()) {
        try {
          this.loading = true;
          const crateId = this.crateId?.['@value'];
          const filePath = this.metadata?.['@id'];
          if (filePath && crateId) {
            let url = `/object/open?id=${encodeURIComponent(crateId)}&path=${encodeURIComponent(filePath)}`;
            const link = document.createElement("a");
            link.download = filePath;
            let response = await this.$http.get({route: url});
            if (response.status !== 200) {
              this.errorDialogVisible = true;
              this.errorDialogTitle = 'Download Error';
              this.errorDialogText = response.statusText;
            } else {
              const data = await response.blob();
              link.href = window.URL.createObjectURL(data);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(link.href);
            }
          } else {
            this.errorDialogVisible = true;
            this.errorDialogTitle = 'Download Error';
            this.errorDialogText = 'No path found for that file';
          }
          this.loading = false;
        } catch (e) {
          this.errorDialogVisible = true;
          this.errorDialogTitle = 'Download Error';
          this.errorDialogText = e.message;
          this.loading = false;
        }
      }
    },
    getMembers() {
      console.log(this.conformsTo);
      return this.conformsTo === 'Collection' || this.conformsTo === 'Dataset';
    },
    setFacetUrl() {
      let route = '/search?f=';
      //TODO: define search facet value from parent ??
      const idSearch = this.crateId?.['@value'];
      if (idSearch) {
        const search = [];
        search.push(idSearch);
        const facet = JSON.stringify({'_root.@id': search});
        this.searchRelated = route + encodeURIComponent(facet);
      }
    },
    setParentLink() {
      if (this.parentId) {
        let route = '/view?id=';
        this.parentLink = route + encodeURIComponent(this.parentId);
      }
    },
    setError() {
      switch (this.error) {
        case 'not_authorized':
          this.notAuthorized = true;
      }
    },
    openRequestModal() {
      this.openDocModal = true;
    }
  }
}
</script>
