<template>
  <span v-if="Array.isArray(this.value)" v-for="v of this.value">
    <a href="v">OH: {{ v }}</a>
  </span>
  <span v-else>
    <div v-if="this.value['@id']">
      <div x-data="collapse" class="collapse border">
      <button class="flex items-center w-full space-x-3 text-xl select-none text-left"
              @click="toggle = !toggle"
              id="collapse-1-button"
              aria-controls="collapse-1-content">
        <svg class="flex-shrink-0 w-6 h-6"
             aria-hidden="true"
             focusable="false"
             xmlns="http://www.w3.org/2000/svg"
             fill="none"
             viewBox="0 0 24 24"
             stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/> </svg>
        <span>{{ first(this.value['name'])?.['@value'] }}</span>
      </button>
    <section v-show='toggle'
             class="overflow-hidden transition-all duration-300 ease-out"
             x-ref="content"
             aria-labelledby="collapse-1-button">
      <li v-for="(value, name) in this.value" :key="this.name">
        <doc-element :crateId="this.crateId" :id="this.parent"
                     :name="name" :value="value" :type="this.value['@type']"
                     :title="this.title" :parentTitle="this.parentTitle" />
      </li>
    </section>
     </div>
    </div>
    <!--TODO: convert the following to vue router-->
    <p v-else>
      <a class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
         :href="getURL()">
        {{ this.value }}</a>
    </p>
  </span>
</template>
<script>

import { defineAsyncComponent } from 'vue';
import { first } from 'lodash';

export default {
  methods: {
    first,
    getURL() {
      if (this.type && this.type.includes('File')) {
        return '/open?id=' + encodeURIComponent(this.crateId) + '&path=' + encodeURIComponent(this.value) + '&title=' + encodeURIComponent(this.title) + '&parent=' + encodeURIComponent(this.parent) + '&parentTitle=' + encodeURIComponent(this.parentTitle)
      } else {
        return '/view?id=' + encodeURIComponent(this.parent);
      }
    }
  },
  components: {
    DocElement: defineAsyncComponent(() =>
        import('./DocElement.component.vue')
    )
  },
  props: {
    parent: null,
    crateId: '',
    parentTitle:'',
    name: '',
    type: '',
    value: {},
    title: ''
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
