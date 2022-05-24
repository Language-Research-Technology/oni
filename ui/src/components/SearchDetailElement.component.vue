<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row :align="'middle'">
      <h5 class="text-2xl font-medium dark:text-white">
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
        Contains:&nbsp;
      </p>
      <div class="flex flex-wrap">
        <button class="text-sm  m-2 text-gray-400 dark:text-gray-300"
            v-for="type of types">{{ type }}
        </button>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="languages">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
       Languages:
      </p>
      <div class="flex flex-wrap">
        <button class="text-sm m-2 text-gray-400 dark:text-gray-300 "
            v-for="language of languages">{{ first(language.name)?.['@value'] }}
        </button>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="Array.isArray(_memberOf) && _memberOf.length > 0"
            class="pt-2">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        Member Of:&nbsp;
      </p>
      <div class="flex flex-wrap">
        <a v-for="mO of _memberOf" :href="'/view?id=' + mO?.['@id']">
          <el-button>{{ first(mO?.name)?.['@value'] || mO?.['@id'] }}</el-button>
        </a>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="Array.isArray(parent) && parent.length > 0"
            class="pt-2">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        From:&nbsp;
      </p>
      <div class="flex flex-wrap">
        <a v-for="p of parent" :href="'/view?id=' + encodeURIComponent(p?.['@id'])">
          <el-button>{{ first(p?.name)?.['@value'] || p?.['@id'] }}</el-button>
        </a>
      </div>
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white"
         v-if="!Array.isArray(_memberOf)">
        &nbsp;In:&nbsp;
      </p>
      <div class="flex flex-wrap" v-if="!Array.isArray(_memberOf)">
        <a :href="'/view?id=' + encodeURIComponent(root?.['@id'])">
          <el-button>{{ first(first(root)?.name)?.['@value'] || first(root)?.['@id'] }}</el-button>
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
import {first, merge, toArray} from 'lodash';

export default {
  components: {},
  props: {
    id: '',
    href: '',
    name: '',
    conformsTo: '',
    types: {},
    languages: {},
    _memberOf: {},
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
    toArray,
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
    mergeQueryFilters({filters, filter}) {
      let decodedFilters = decodeURIComponent(filters);
      decodedFilters = JSON.parse(decodedFilters);
      const merged = merge(decodedFilters, filter);
      return encodeURIComponent(JSON.stringify(merged));
    }
  }
}
</script>
