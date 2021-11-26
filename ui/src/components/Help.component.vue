<template>
  <div class="w-full h-screen flex justify-center bg-gray-100">
    <div class="h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center">
      <p class="text-right mb-4">{{ help }}</p>
      <help-box
          v-for="code of this.codes"
          :title="code.title"
          :head="code.head"
          :box-header="code.boxHeader"
          :box-types="code.boxTypes"
          :box="code.box"
      />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
  components: {
    HelpBox: defineAsyncComponent(() =>
        import('./HelpBox.component.vue')
    )
  },
  data() {
    return {
      codes: [ {
        title: 'HTTP Get : /data/item',
        head: `Required Parameters:
          id: Id of collection
          file: ID of file from repository`,
        boxHeader: 'Example: Download a file via REST API',
        boxTypes: ['python'],
        box: [ {
          body: '',
          selectType: 'python'
        }
        ]
      } ]
    };
  },
  mounted() {
  }
};
</script>
