<template>
  <div class="p-6 bg-indigo-100 flex justify-center">
    <div class="container max-w-screen-lg mx-auto">
      <div class="md:col-span-5">
        <p class="relative space-x-3 font-bold text-xl select-none text-left">
          {{ getTitle() }}
        </p>
      </div>
      <ul >
        <li v-for="(value, name) in meta" :key="name" >
          <doc-element :crateId="this.crateId" :parentTitle="this.title"
                       :id="this.meta['@id']" :name="name" :value="value"
                       />
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
    crateId: '',
    meta: {}
  },
  components: {
    DocElement: defineAsyncComponent(() =>
        import('./DocElement.component.vue')
    )
  },
  mounted() {
    this.title = this.getTitle();
  },
  methods: {
    getTitle() {
      const title = first(this.meta['name'])?.['@value'];
      if (title) {
        this.title = title;
        return title;
      } else {
        return this.meta['@id'];
      }
    }
  },
  data() {
    return {
      title: '',
      type:''
    }
  }
}
</script>
