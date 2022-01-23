<template>
  <div class="p-6 bg-gray-200 flex justify-center">
    <div class="container max-w-screen-lg mx-auto">
      <p class="relative space-x-3 font-bold p-3 text-xl select-none text-left">
        <button @click="this.$router.back()"><i class="fa fa-backward"></i></button>
      </p>
      <div class="shadow bg-white">
        <div v-if="this.type==='pdf'">
          <pdf v-for="i in numPages"
               :key="i"
               :src="pdfdata"
               :page="i">
            <template slot="loading">
              loading content here...
            </template>
          </pdf>
        </div>
        <div v-else>
          {{ this.data }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import pdf from 'vue3-pdf';
import { first } from 'lodash';

export default {
  components: {
    pdf
  },
  data() {
    return {
      pdfdata: null,
      numPages: 1,
      data: null,
      type: 'text',
      id: '',
    }
  },
  async mounted() {
    const id = encodeURIComponent(this.$route.query.id)
    this.id = id;
    const path = encodeURIComponent(this.$route.query.path);
    let route = `/object/open?id=${ id }`;
    if (path) {
      route += `&path=${ path }`;
    }
    console.log(`Sending route: ${ route }`);
    let response = await this.$http.get({ route: route });
    //TODO: Ask for MIME types
    if (path && path.endsWith(".pdf")) {
      this.type = 'pdf';
      this.data = await response.blob();
      //var blob = new Blob([this.data], {type: 'application/pdf'});
      console.log(this.data);
      const blobURL = window.URL.createObjectURL(this.data);
      this.pdfdata = pdf.createLoadingTask(blobURL);
      console.log("this.pdfsrc.promise", this.pdfdata.promise);
      this.pdfdata.promise.then(pdf => {
        console.log("pdf in callback", pdf);
        this.numPages = pdf.numPages;
        console.log(
            `this.numPages: ${ this.numPages } pdf.numPages: ${ pdf.numPages } `
        );
        console.log(this);
      });
    } else {
      this.data = await response.text();
    }
  },
  methods: {
    getTitle() {
      const title = first(this.meta['name']);
      return title?.['@value'] || this.meta['@id'];
    }
  }
}
</script>
