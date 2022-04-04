<template>
  <el-row :class="this.index % 2 == 0 ? 'bg-white': 'bg-gray-100'" :name="this.name">
    <el-col :xs="24" :sm="9" :md="8" :lg="4" :xl="4">
      <h4 class="p-3 font-bold break-words">{{ clean(this.name) }}</h4>
    </el-col>
    <el-col :xs="24" :sm="15" :md="16" :lg="20" :xl="20">
      <div class="p-3">
        <div class=""
             v-if="!isString(this.value)" v-for="val in toArray(this.value)">
          <div v-if="val['@id']" v-loading="loading" >
            <doc-sub-element :crateId="this.crateId" :parent="this.parent"
                             :name="this.name"
                             :value="val" :type="this.type" :title="getTitle(val['name'])"
                             :index="this.index" :root="this.root"/>
          </div>
          <div v-else>
            <span v-if="val['@value']">{{ val['@value'] }}</span>
            <span v-else>{{ val }}</span>
          </div>
        </div>
        <div v-else v-loading="loading" >
          <doc-sub-element :crateId="this.crateId" :parent="this.parent"
                           :name="this.name" :value="this.value"
                           :type="this.type" :title="this.title"
                           :index="this.index" :root="this.root"/>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script>
import {defineAsyncComponent} from 'vue';
import {toArray, first, isEmpty} from 'lodash';

export default {
  components: {
    DocSubElement: defineAsyncComponent(() =>
        import('./DocSubElement.component.vue')
    )
  },
  props: ['index', 'id', 'crateId', 'parent', 'name', 'value', 'title', 'type', 'root'],
  mounted() {
    this.loading = false;
  },
  methods: {
    toArray,
    first,
    isEmpty,
    isString(value) {
      return typeof value === 'string' || value instanceof String;
    },
    clean(text) {
      if (text.startsWith('@')) {
        return this.capitalizeFirstLetter(text.replace('@', ''));
      } else {
        return this.capitalizeFirstLetter(text.replace(/([a-z])([A-Z])/g, '$1 $2'));
      }
    },
    capitalizeFirstLetter(string) {
      return string[0].toUpperCase() + string.slice(1);
    },
    getTitle(title) {
      return first(title)?.['@value'] || '';
    }
  },
  data() {
    return {
      loading: true
    }
  }
}
</script>
