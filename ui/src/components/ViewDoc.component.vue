<template>
  <el-row>
    <el-col :span="24">
      <div v-for="(value, name, i) in meta" :key="name">
        <doc-element v-if="display(value, name)" :crateId="this.crateId" :parentTitle="this.title"
                     :id="this.meta['@id']" :name="name" :value="value"
                     :index="i" :root="this.root"
        />
      </div>
    </el-col>
  </el-row>
</template>

<script>

import {defineAsyncComponent} from 'vue';
import {isEmpty} from 'lodash';

export default {
  props: ['crateId', 'meta', 'root'],
  components: {
    DocElement: defineAsyncComponent(() =>
        import('./DocElement.component.vue')
    )
  },
  mounted() {
  },
  methods: {
    display(value, name) {
      if (name.startsWith('_text')) {
        return false;
      } else return !isEmpty(value);

    }
  },
  data() {
    return {
      title: '',
      type: ''
    }
  }
}
</script>
