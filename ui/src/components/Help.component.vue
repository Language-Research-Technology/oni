<template>
  <div class="w-full h-screen flex justify-center bg-gray-100">
    <div class="h-auto rounded-lg pt-8 pb-8 px-8 flex-col items-center">
      <h2>{{ helpHead }}</h2>
      <p class="text-right mb-4">{{ helpBody }}</p>
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
      helpHead: 'Help',
      helpBody: 'Note: Some API endpoints require authorization, to request an api token go to your user area and click Generate. The api token will only be shown once.',
      codes: [
        {
          title: 'HTTP Get : /api/auth/memberships',
          head: `Get and set your membership access to collections.`,
          boxHeader: 'Example: Show and set your access and memberships',
          boxTypes: [ 'python' ],
          box: [ {
            body: `
import requests
import json

# Check your membership
host = "${ location.protocol }//${ location.host }"
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer 12356'
}

response = requests.request("GET", host + '/api/auth/memberships', headers=headers, data=payload)
result = json.loads(response.text)
print(json.dumps(result, indent=2))
`,
            selectType: 'python'
          }
          ]
        },
        {
          title: 'HTTP Get : /api/data/item',
          head: `Required Parameters:
id: Id of collection
file: ID of file from repository`,
          boxHeader: 'Example: Download a file via REST API',
          boxTypes: [ 'python' ],
          box: [ {
            body: `
import requests

# Download FILE_ID from RECORD_ID collection
host = "${ location.protocol }//${ location.host }"
url = host + "/api/data/item?id=RECORD_ID&file=FILE_ID"

payload={}
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer 123456'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)`,
            selectType: 'python'
          }
          ]
        }
      ]
    };
  },
  mounted() {
  }
};
</script>
