<template>
  <span v-if="Array.isArray(this.value)" v-for="v of this.value">
    <a href="v">OH: {{ v }}</a>
  </span>
  <span v-else>
    <div v-if="this.value['@id']">
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
        <span>{{ first(this.value['name'])?.['@value'] }}</span>
      </button>
      <section v-show="toggle"
               class="transition-all duration-300 ease-out w-full"
               x-ref="content"
               aria-labelledby="collapse-1-button">
        <el-row v-for="(value, name, i) in this.value" :key="this.name">
          <el-col :span="24">
          <doc-element :crateId="this.crateId" :id="this.parentId"
                       :name="name" :value="value" :type="this.value['@type']"
                       :title="this.title" :parentTitle="this.parentTitle"
                       :index="i" :root="this.root"/>
            </el-col>
        </el-row>
      </section>
          </el-col>
     </el-row>
    </div>
    <!--TODO: convert the following to vue router-->
      <el-row v-else v-if="this.value">
        <el-col :span="24">
                <a class="break-words underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                   :href="getURL()">
        {{ this.value }}</a>
        </el-col>
      </el-row>
  </span>
</template>
<script>

import {defineAsyncComponent} from 'vue';
import {first} from 'lodash';

export default {
  props: ['index', 'parentId', 'crateId', 'parentTitle', 'name', 'type', 'value', 'title', 'root'],
  methods: {
    first,
    getURL() {
      let id;
      if (this.type && this.type.includes('File')) {
        if (this.root) {
          id = this.root['@id'];
        } else if(this.crateId) {
          id = first(this.crateId)?.['@value'] || this.crateId['@value'];
        }
        //TODO: fix this unhandled id
        return '/open?id=' + encodeURIComponent(id) + '&path=' + encodeURIComponent(this.value) + '&title=' + encodeURIComponent(this.title) + '&parent=' + encodeURIComponent(this.parentId) + '&parentTitle=' + encodeURIComponent(this.parentTitle)
      } else {
        //TODO: decide what to put in a href that is not searchable
        id = this.value;
        return '/view?id=' + encodeURIComponent(id);
      }
    }
  },
  components: {
    DocElement: defineAsyncComponent(() =>
        import('./DocElement.component.vue')
    )
  },
  mounted() {
  },
  data() {
    return {
      toggle: false
    }
  }
}
</script>
