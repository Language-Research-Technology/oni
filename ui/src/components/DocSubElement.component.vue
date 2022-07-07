<template>
  <el-row class="md:container w-full">
  <span v-if="Array.isArray(this.value)" v-for="v of this.value" v-loading="loading">
    <a href="v">OH: {{ v }}</a>
  </span>
    <span class="md:container w-full">
    <div class="md:container w-full" v-if="this.value['@id']" v-loading="loading">
      <el-row :gutter="20" x-data="collapse" class="collapse">
        <el-col :span="24">
      <button class="flex items-center w-full space-x-3 text-xl select-none text-left"
              @click="toggle = !toggle"
              id="collapse-1-button"
              aria-controls="collapse-1-content">
        <svg :style="[ toggle ? '' : {'transform': 'rotate(270deg)'} ]"
             class="flex-shrink-0 w-6 h-6"
             aria-hidden="true"
             focusable="false"
             xmlns="http://www.w3.org/2000/svg"
             fill="none"
             viewBox="0 0 24 24"
             stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
        <span><p class="text-base">{{ getTitle() }}</p></span>
      </button>
      <section v-show="toggle"
               class="transition-all duration-300 ease-out w-full"
               x-ref="content"
               aria-labelledby="collapse-1-button">
        <el-row v-for="(value, name, i) in this.value" :key="this.name">
          <el-col :span="24" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <doc-element :crateId="this.crateId"
                       :name="name" :value="value" :type="this.value['@type']"
                       :title="this.title" :parent="this.value"
                       :index="i" :root="this.root"/>
            </el-col>
        </el-row>
      </section>
          </el-col>
     </el-row>
    </div>
      <!--TODO: convert the following to vue router-->
      <el-row v-else v-if="this.value">
        <el-col :span="24" :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
          <a :href="getURL()">
            <el-button :type="'default'">Search Link</el-button>
          </a>
        </el-col>
      </el-row>
  </span>
  </el-row>
</template>
<script>

import {defineAsyncComponent} from 'vue';
import {first} from 'lodash';

export default {
  props: ['index', 'parent', 'crateId', 'name', 'type', 'value', 'title', 'root'],
  methods: {
    first,
    getURL() {
      let id;
      //TODO: decide what to put in a href that is not searchable
      id = this.value;
      const _crateId = this.crateId?.['@value'];
      if (_crateId) {
        return `/view?id=${encodeURIComponent(id)}&_crateId=${encodeURIComponent(_crateId)}`;
      } else {
        return `/view?id=${encodeURIComponent(id)}`;
      }

    },
    getTitle() {
      let title = first(this.value['name'])
      if (title) {
        return title['@value'] || title;
      } else {
        return this.value['@id']
      }
    }
  },
  components: {
    DocElement: defineAsyncComponent(() =>
        import('./DocElement.component.vue')
    )
  },
  created() {
    this.loading = true;
  },
  mounted() {
    this.loading = false;
  },
  data() {
    return {
      toggle: false,
      loading: false
    }
  }
}
</script>
