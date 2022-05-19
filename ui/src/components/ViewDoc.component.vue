<template>
  <el-row v-loading="this.loading">
    <el-col :span="24">
      <div v-for="(value, name, i) in meta" :key="name">
        <doc-element v-if="display(value, name)" :crateId="this.crateId" :parent="value"
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
    this.loading = false;
  },
  methods: {
    display(value, name) {
      //TODO: Is this the right place to remove the things that we dont want displayed?
      if (name.startsWith('_')) {
        return false;
      } else return !isEmpty(value);

    }
  },
  data() {
    return {
      title: '',
      type: '',
      loading: true
    }
  }
}
</script>
