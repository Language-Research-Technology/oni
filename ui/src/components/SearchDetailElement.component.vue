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
    <el-row :align="'middle'">
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
    <el-row :align="'middle'">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        <span>From:&nbsp;</span>
      </p>
      <div class="flex flex-wrap" v-if="root">
        <button
            class="text-sm px-2 pb-1 pt-1 m-2 text-gray-400 dark:text-gray-300 border border-gray-300 rounded shadow"
            v-for="r of root">
          <router-link :to="getFilter({field: '_root.@id', id: r['@id']})">{{ first(r.name)?.['@value'] }}</router-link>
        </button>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="memberOf">
      <p> Related: {{ first(memberOf)?.['@id'] }}</p>
    </el-row>
    <el-row :align="'middle'" v-if="highlight">
      <ul>
        <li v-for="hl of highlight"
            v-html="'...' + first(hl) + '...'"
            class="p-2"></li>
      </ul>
    </el-row>
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
    highlight: {}
  },
  data() {
    return {}
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
    mergeQueryFilters({filters, filter}) {
      let decodedFilters = decodeURIComponent(filters);
      decodedFilters = JSON.parse(decodedFilters);
      const merged = merge(decodedFilters, filter);
      return encodeURIComponent(JSON.stringify(merged));
    }
  }
}
</script>
