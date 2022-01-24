<template>
  <div class="flex">
    <h4 class="w-1/3 p-3 font-bold">{{ clean(this.name) }}</h4>
    <div class="w-2/3 p-3">
      <div v-if="!isString(this.value)" v-for="val in toArray(this.value)" class="flex">
        <div v-if="val['@id']">
          <doc-sub-element :crateId="this.crateId" :parentTitle="this.parentTitle" :parent="this.id" :name="this.name"
                           :value="val" :type="this.type" :title="getTitle(val['name'])"/>
        </div>
        <div v-else>
          <span v-if="val['@value']">{{ val['@value'] }}</span>
          <span v-else>{{ val }}</span>
        </div>
      </div>
      <div v-else>
        <doc-sub-element :crateId="this.crateId" :parentTitle="this.parentTitle" :parent="this.id"
                         :name="this.name" :value="this.value"
                         :type="this.type" :title="this.title"/>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { toArray, first } from 'lodash';

export default {
  components: {
    DocSubElement: defineAsyncComponent(() =>
        import('./DocSubElement.component.vue')
    )
  },
  props: {
    id: null,
    crateId: '',
    parentTitle: '',
    name: '',
    value: {},
    title: '',
    type: ''
  },
  mounted() {
  },
  methods: {
    toArray,
    first,
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
    }
  }
}
</script>
