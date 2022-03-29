<template>
  <el-row :justify="'center'" class="bg-gray-50">
    <el-col :span="20">
      <div class="container max-w-screen-lg mx-auto">
        <h3 class="relative space-x-3 font-bold p-3 text-xl select-none text-left">
          <a class="break-words underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
             :href="'/view?id=' + encodeURIComponent(this.id)">{{
              this.id || decodeURIComponent(this.id)
            }}</a> &gt; {{ this.title }}
        </h3>
        <div v-loading="loading" class="shadow m-6 p-2">
          <div v-if="this.type === 'pdf'">
            <pdf v-for="i in numPages"
                 :key="i"
                 :src="pdfdata"
                 :page="i">
              <template slot="loading">
                loading content here...
              </template>
            </pdf>
          </div>
          <div class="p-4 break-words" v-else-if="this.type === 'txt'">
            {{ this.data }}
          </div>
          <div class="p-4" v-else-if="this.type === 'audio'">
            <audio controls>
              <source :src="this.data">
              Your browser does not support the audio element.
            </audio>
          </div>
          <div class="p-4" v-else-if="this.type === 'video'">
            <video controls>
              <source :src="this.data" :type="this.sourceType">
              Your browser does not support the video element.
            </video>
          </div>
          <div class="p-4" v-else>
            <img height="500px" :src="this.data"/>
          </div>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import pdf from 'vue3-pdf';
import {first} from 'lodash';
import {VideoPlay} from "@element-plus/icons-vue";

export default {
  components: {
    VideoPlay,
    pdf
  },
  data() {
    return {
      title: '',
      pdfdata: null,
      numPages: 1,
      data: null,
      type: 'text',
      sourceType: '',
      id: '',
      name: '',
      parent: '',
      parentTitle: ''
    }
  },
  async mounted() {
    this.loading = true;
    const id = encodeURIComponent(this.$route.query.id);
    this.id = id;
    const path = encodeURIComponent(this.$route.query.path);
    let route = `/object/open?id=${id}`;
    if (path) {
      route += `&path=${path}`;
    }
    console.log(route);
    let response = await this.$http.get({route: route});
    const title = decodeURIComponent(this.$route.query.title);
    if (title) {
      this.title = title;
    }
    const parent = decodeURIComponent(this.$route.query.parent);
    if (parent) {
      this.parent = parent;
    }
    const parentTitle = decodeURIComponent(this.$route.query.parentTitle);
    if (parentTitle) {
      this.parentTitle = parentTitle;
    }
    //TODO: Ask for MIME types

    if (path && (path.endsWith(".txt") || path.endsWith(".csv") || path.endsWith(".eaf"))) {
      this.type = 'txt';
      this.data = await response.text();
    } else {
      this.data = await response.blob();
      const blobURL = window.URL.createObjectURL(this.data);
      if (path && (path.endsWith(".mp3") || path.endsWith(".wav"))) {
        this.type = 'audio';
        this.data = blobURL;
      } else if(path && path.endsWith(".mp4")){
        this.type = 'video';
        this.sourceType = 'video/mp4';
        this.data = blobURL;
      }else if (path && path.endsWith(".pdf")) {
        this.type = 'pdf';
        this.pdfdata = pdf.createLoadingTask(blobURL);
        this.pdfdata.promise.then(pdf => {
          this.numPages = pdf.numPages;
          console.log(`this.numPages: ${this.numPages} pdf.numPages: ${pdf.numPages}`);
        });
      } else {
        this.type = 'other';
        this.data = blobURL;
      }
    }
    this.loading = false;
  },
  methods: {
    getTitle() {
      const title = first(this.meta['name']);
      return title?.['@value'] || this.meta['@id'];
    }
  }
}
</script>
