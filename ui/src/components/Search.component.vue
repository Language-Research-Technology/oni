<template>
  <div class="flex border-2 rounded">
    <input @keyup.enter="this.search()" type="text" class="px-4 py-2 w-80" placeholder="Search..."
           v-model="searchInput">
    <button @click="this.search()" class="flex items-center justify-center px-4 border-l">
      <svg class="w-6 h-6 text-gray-600" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 24 24">
        <path
            d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
      </svg>
    </button>
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
