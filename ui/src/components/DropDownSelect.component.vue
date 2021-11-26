<template>
      <div class="px-4 p-4 border-blue-800">
        <div class="bg-blue-500 text-gray-200 px-2 py-3 tracking-wide rounded-lg shadow-lg text-right">
          <div class="relative inline-block">{{ head }}</div>
          &nbsp;
          <Menu as="div" class="relative inline-block text-left">
            <div>
              <MenuButton
                  class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
                {{ boxTypes[0] }}
                <ChevronDownIcon class="-mr-1 ml-2 h-5 w-5" aria-hidden="true"/>
              </MenuButton>
            </div>
            <transition enter-active-class="transition ease-out duration-100"
                        enter-from-class="transform opacity-0 scale-95"
                        enter-to-class="transform opacity-100 scale-100"
                        leave-active-class="transition ease-in duration-75"
                        leave-from-class="transform opacity-100 scale-100"
                        leave-to-class="transform opacity-0 scale-95">
              <MenuItems
                  class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div class="py-1">
                  <MenuItem v-for="item of this.boxTypes"
                            v-slot="{ active }">
                    <a @click="selectType(item)"
                       :class="[active ? 'bg-gray-100 text-gray-900' : 'text-gray-700', 'pointer block px-4 py-2 text-sm']">
                      {{ item }}
                    </a>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
        <div>
          <!-- TODO: pass code as props -->
    <pre class="important-overflow-hidden w-full text-sm max-h-100 rounded-lg shadow-lg">
                      <code class="language-python">
import requests

url = "http://localhost:8080/api/data/item?id=RECORD_ID&file=FILE_ID"

payload={}
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer 123456'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)
                      </code>
                    </pre>
        </div>
      </div>

</template>

<script>
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/solid'
import { first } from 'lodash';

export default {
  props: {
    head: {
      type: String,
      required: true
    },
    boxTypes: {
      type: Array,
      required: true
    },
    body: {
      type: Object,
      required: true,
    }
  },
  components: {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    ChevronDownIcon,
  },
  methods: {
    selectType(type){
      this.type = type;
    }
  },
  mounted() {
    Prism.highlightAll();
    this.$nextTick(async function () {
      this.type = first(this.boxTypes);
    });
  }
}
</script>
