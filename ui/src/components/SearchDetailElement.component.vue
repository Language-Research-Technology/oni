<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row :align="'middle'">
      <h5 class="mb-2 text-2xl font-medium dark:text-white">
        <a :href="href"
           class="text-blue-600 hover:text-blue-800 visited:text-purple-600">{{ name }}</a>
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
import {first} from 'lodash';

export default {
  components: {},
  props: {
    href: '',
    name: '',
    conformsTo: '',
    types: {},
    languages: {},
    memberOf: {},
    highlight: {}
  },
  data() {
    return {}
  },
  methods: {
    first
  }
}
</script>
