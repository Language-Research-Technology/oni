<template>
  <div class="p-6 bg-gray-200 flex justify-center">
    <div class="container max-w-screen-lg mx-auto">
      <div class="md:col-span-5">
        <p class="relative space-x-3 font-bold text-xl select-none text-left">
          {{ getTitle() }}
        </p>
      </div>
      <ul>
        <li v-for="(value, name) in meta" :key="name">
          <doc-element :crateId="this.crateId" :id="this.meta['@id']" :name="name" :value="value"/>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

import { defineAsyncComponent } from 'vue';
import { first } from 'lodash';

export default {
  props: {
    title: '',
    crateId: '',
    meta: {}
  },
  components: {
    DocElement: defineAsyncComponent(() =>
        import('./DocElement.component.vue')
    )
  },
  methods: {
    getTitle() {
      const title = first(this.meta['name']);
      return title?.['@value'] || this.meta['@id'];
    }
  },
  data() {
    return {}
  }
}
</script>
