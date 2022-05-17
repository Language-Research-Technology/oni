<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row :align="'middle'">
      <h5 class="mb-2 text-2xl font-medium dark:text-white">
        <a :href="href"
           class="text-blue-600 hover:text-blue-800 visited:text-purple-600 break-all">{{ this.name || this.id }}</a>
      </h5>
    </el-row>
    <el-row :align="'middle'">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        {{ conformsTo }}
      </p>
    </el-row>
    <el-row :align="'middle'">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        <span>Contains:&nbsp;</span>
      </p>
      <div class="flex flex-wrap">
        <button
            class="text-sm px-2 pb-1 pt-1 m-2 text-gray-400 dark:text-gray-300 border border-gray-300 rounded shadow"
            v-for="type of types">{{ type }}
        </button>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="languages">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        <span>Languages:&nbsp;</span>
      </p>
      <div class="flex flex-wrap">
        <button
            class="text-sm px-2 pb-1 pt-1 m-2 text-gray-400 dark:text-gray-300 border border-gray-300 rounded shadow"
            v-for="language of languages">{{ first(language.name)?.['@value'] }}
        </button>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="memberOf">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        <span>Member Of:&nbsp;</span>
      </p>
      <div class="flex flex-wrap">
        <a :href="getFilter({field: '_root.@id', id: first(memberOf)?.['@id']})">
        <el-button>{{ first(memberOf)?.['@id'] }}</el-button>
      </a>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="parent">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        <span>From:&nbsp;</span>
      </p>
      <div class="flex flex-wrap">
        <a :href="'/view?id=' + encodeURIComponent(this.parentId)">
        <el-button>{{ this.parentName }}</el-button>
      </a>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="highlight">
      <ul>
        <li v-for="hl of highlight"
            v-html="'...' + first(hl) + '...'"
            class="p-2"></li>
      </ul>
    </el-row>
    <br/>
    <hr class="divide-y divide-gray-500"/>
  </div>
</template>
<script>
import {first, merge} from 'lodash';

export default {
  components: {},
  props: {
    id: '',
    href: '',
    name: '',
    conformsTo: '',
    types: {},
    languages: {},
    memberOf: {},
    root: {},
    highlight: {},
    parent: {}
  },
  data() {
    return {
      parentId: '',
      parentName: ''
    }
  },
  methods: {
    first,
    getFilter({field, id}) {
      const filter = {};
      filter[field] = [id];
      let filterEncoded = encodeURIComponent(JSON.stringify(filter));
      if (this.$route.query.f) {
        filterEncoded = this.mergeQueryFilters({filters: this.$route.query.f, filter})
      }
      if (this.$route.query.q) {
        const searchQuery = `q=${this.$route.query.q}`;
        return `/search?${searchQuery}&f=${filterEncoded}`;
      } else {
        return `/search?f=${filterEncoded}`;
      }
    },
    getParent() {
      const parent = first(this.parent);
      if (parent) {
        this.parentId = parent?.['@id'];
        this.parentName = first(parent?.name)?.['@value'] || this.parentId;
      }
    },
    mergeQueryFilters({filters, filter}) {
      let decodedFilters = decodeURIComponent(filters);
      decodedFilters = JSON.parse(decodedFilters);
      const merged = merge(decodedFilters, filter);
      return encodeURIComponent(JSON.stringify(merged));
    }
  },
  beforeMount() {
    this.getParent();
  }
}
</script>
