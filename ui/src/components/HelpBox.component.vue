<template>
  <div class="min-h-screen p-6 bg-gray-200 flex justify-center">
    <div class="container max-w-screen-lg mx-auto">
      <div class="md:col-span-5">
        <div class="relative">
          <h2>{{ title }}</h2>
          <p>{{ head }}</p>
        </div>
        <drop-down-select
            :head="boxHeader"
            :box-header="boxHeader"
            :box-types="boxTypes"
            :body="box"
        />
      </div>
    </div>
  </div>
</template>

<script>

import { defineAsyncComponent } from 'vue';

export default {
  props: {
    head: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true
    },
    boxHeader: {
      type: String,
      required: true
    },
    boxTypes: {
      type: Array,
      required: true
    },
    box: {
      type: Array,
      required: true
    }
  },
  components: {
    DropDownSelect: defineAsyncComponent(() =>
        import('./DropDownSelect.component.vue')
    )
  }, mounted() {
  },
  data() {
    return {}
  }
}
</script>
