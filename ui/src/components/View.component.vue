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
      <el-row>
        <el-button-group v-if="this.searchRelated">
          <el-link class="m-2" v-for="mO of this.searchRelated" :href="mO.search" :underline="false">
            <el-button>Member of &nbsp;<strong>{{ mO.name }}</strong>
              <el-icon class="el-icon--right">
                <Switch/>
              </el-icon>
            </el-button>
          </el-link>
          <el-link class="m-2" v-if="this.parentLink" :href="this.parentLink" :underline="false">
            <el-button>Parent: {{ this.parentName || this.parentId }}</el-button>
          </el-link>
        </el-button-group>
      </el-row>
      <el-row>
        <hr class="divider divider-gray pt-2"/>
      </el-row>
      <el-row>
        <el-button-group class="m-2">
          <template v-if="!this.notAuthorized">
            <el-link class="mr-2" v-if="this.isFile() && !this.cannotOpenFile" :href="this.fileUrl" :underline="false">
              <el-button type="default" class="px-2">Preview File</el-button>
            </el-link>
            <el-link class="mr-2" v-loading="this.loading" v-if="this.isFile() && !this.cannotOpenFile"
                     :underline="false"
                     v-on:click="this.downloadFileUrl()">
              <el-button type="default">Download&nbsp;<el-icon>
                <Download/>
              </el-icon>
              </el-button>
            </el-link>
          </template>
          <el-button type="default" v-if="this.notAuthorized" v-on:click="openRequestModal()">Request Access</el-button>
        </el-button-group>
      </el-row>
      <view-doc :crateId="this.crateId" :meta="this.metadata" :root="this.root"/>
      <!--      <view-members :crateId="this.crateId" :limitMembers=10-->
      <!--                    :conformsToName="'Collections'"-->
      <!--                    :conformsTo="conformsToCollection"/>-->
      <view-members-search v-if="getMembers()" :crateId="this.crateId" :limitMembers=10
                           :conformsToName="'Related Collections'" :conformsTo="conformsToCollection"/>
      <view-members-search v-if="getMembers()" :crateId="this.crateId" :limitMembers=10
                           :conformsToName="'Related Objects'" :conformsTo="conformsToObject"/>
      <el-row>
        &nbsp;
      </el-row>

    </el-col>
  </el-row>
  <div v-else>
    <view-doc-error v-if="this.noData"/>
  </div>
  <request-dialog :dialogVisible="this.openDocModal" :enrollmentUrl="this.enrollment?.url"
                  :enrollmentLabel="this.enrollment?.label || 'To request access follow this link'"
                  :enrollmentClass="this.enrollment?.class || 'underline text-blue-600 hover:text-blue-800 visited:text-purple-600 text-center'"
                  v-on:close="this.openDocModal = false"/>
  <el-dialog v-model="errorDialogVisible" width="30%" center>
    <el-alert :title="this.errorDialogTitle" type="warning"
              :closable="false">
      <p class="break-normal">{{ this.errorDialogText }}</p>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="errorDialogVisible = false">Close</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import {Switch, Download} from "@element-plus/icons-vue";
import {first} from 'lodash';
import {defineAsyncComponent} from 'vue';
import {putLocalStorage} from '@/storage';

export default {
  components: {
    Switch,
    Download,
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
      searchRelated: [],
      parentId: '',
      parentLink: '',
      parentName: '',
      error: '',
      notAuthorized: false,
      _access: {},
      enrollment: {
        url: '', label: ''
      },
      openDocModal: false,
      loading: false,
      errorDialogVisible: false,
      errorDialogText: '',
      _memberOf: null,
      noData: false,
      conformsToCollection: '',
      conformsToObject: ''
    }
  },
  async mounted() {
    try {
      const id = encodeURIComponent(this.$route.query.id);
      const crateId = encodeURIComponent(this.$route.query._crateId)
      const element = encodeURIComponent(this.$route.query.element);
      let route = `/search/items?id=${id}&_crateId=${crateId}`;
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
      this.conformsToCollection = this.$store.state.configuration.ui.conformsTo?.collection;
      this.conformsToObject = this.$store.state.configuration.ui.conformsTo?.object;
    } catch (e) {
      this.errorDialogVisible = true;
      this.errorDialogTitle = 'Error';
      this.errorDialogText = e.message;
      this.loading = false;
      console.error(e);
    }
  },
  methods: {
    first,
    populate(metadata) {
      if (metadata?._source) {
        this.root = first(metadata._source._root);
        this.crateId = first(metadata._source._crateId);
        this.conformsTo = metadata._source.conformsTo;
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
        this._memberOf = this.metadata._memberOf;
        this._access = this.metadata._access;
        if (this._access && !this._access.hasAccess) {
          this.getEnrollment();
        }
        //this.metadata = omitBy(metadata._source, (value, key) => key.startsWith('_'));
        //console.log(this.metadata)
      } else {
        this.noData = true;
      }
    },
    isFile() {
      if (this.metadata) {
        const type = this.metadata['@type'];
        if (Array.isArray(type)) {
          return type.find((t) => t.toLowerCase() === 'file')
        } else if (typeof type === 'string') {
          return type.toLowerCase() === 'file';
        } else return false;
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
              if (response.status === 404) {
                this.errorDialogText = 'The file was not found in the path, please contact your Data Provider or Data Steward';
              } else {
                this.errorDialogText = response.statusText;
              }
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
      if (this.conformsTo) {
        for (let c of this.conformsTo) {
          if (c['@id'] === this.$store.state.configuration.ui.conformsTo?.collection || c['@id'] === this.$store.state.configuration.ui.conformsTo?.object) {
            return true
          }
        }
      }
    },
    setFacetUrl() {
      if (Array.isArray(this._memberOf)) {
        let route = '/search?f=';
        //TODO: define search facet value from parent ??
        for (let mO of this._memberOf) {
          const search = [];
          search.push(mO['@id']);
          const facet = JSON.stringify({'_memberOf.@id': search});
          const name = mO['name'];
          this.searchRelated.push({
            name: first(name)?.['@value'] || mO['@id'],
            search: route + encodeURIComponent(facet)
          });
        }
      }
    },
    setParentLink() {
      if (this.parentId) {
        let route = `/view?id=${encodeURIComponent(this.parentId)}&_crateId=${encodeURIComponent(this.crateId['@value'])}`;
        this.parentLink = route;
      }
    },
    setError() {
      switch (this.error) {
        case 'not_authorized':
          this.notAuthorized = true;
      }
    },
    openRequestModal() {
      putLocalStorage({key: 'lastRoute', data: this.$route.fullPath});
      this.openDocModal = true;
    },
    getEnrollment() {
      if (this.$store.state.configuration.ui.licenses) {
        const license = this.$store.state.configuration.ui.licenses.find((l) => {
          if (l.group === this._access.group) {
            return l.enrollment;
          }
        });
        this.enrollment = license?.enrollment;
      } else {
        this.errorDialogText = 'No licenses configured';
      }
    }
  }
}
</script>
