<template>
  <el-row :justify="'center'" class="bg-gray-50">
    <el-col :span="20">
      <div class="container max-w-screen-lg mx-auto">
        <el-row>
          <el-col :xs="24" :sm="15" :md="16" :lg="18" :xl="20">
            <h3 class="relative space-x-3 font-bold p-3 text-xl select-none text-left">
              <a class="break-words no-underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                 :href="'/view?id=' + encodeURIComponent(this.path)">
                <i class="fa fa-1x fa-arrow-left"></i> File Metadata
              </a>
              <span>{{ this.parentTitle || decodeURIComponent(this.path) }}</span>
            </h3>
          </el-col>
          <el-col :xs="24" :sm="9" :md="8" :lg="6" :xl="4">
            <!-- TODO add a download widget here-->
          </el-col>
        </el-row>
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
            <el-table v-if="this.loadCsv" :data="this.csv.data" style="width: 100%">
              <el-table-column v-for="guessedColumn of this.csv.cols"
                               :prop="guessedColumn" :label="guessedColumn"></el-table-column>
            </el-table>
            <div v-else>{{ this.data }}</div>
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
import pdf from '@jbtje/vue3pdf'
import {first, isUndefined} from 'lodash';
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
      parentId: '',
      path: '',
      name: '',
      parent: '',
      parentTitle: '',
      loadCsv: false,
      csv: {},
      loading: false
    }
  },
  async mounted() {
    this.loading = true;
    const id = encodeURIComponent(this.$route.query.id);
    this.id = id;
    this.parentId = encodeURIComponent(this.$route.query.parentId);
    this.path = this.$route.query.path;
    let route = `/object/open?id=${id}`;
    if (this.path != '') {
      route += `&path=${this.path}`;
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
    if (this.path && (this.path.endsWith(".txt") || this.path.endsWith(".csv") || this.path.endsWith(".eaf"))) {
      this.type = 'txt';
      this.data = await response.text();
      if (this.path.endsWith(".csv")) {
        try {
          const parsedCsv = this.$papa.parse(this.data);
          if (parsedCsv?.data && parsedCsv?.data?.length > 1) {
            //Guess that the first elements are the headers. Then shift the array.
            this.csv.cols = first(parsedCsv.data);
            parsedCsv.data.shift();
            this.csv.data = parsedCsv.data.map((r) => {
              const row = {};
              for (let [index, col] of this.csv.cols.entries()) {
                if (isUndefined(col) || col === "") {
                  col = '__nocolumn__';
                }
                row[col] = r[index];
              }
              return row;
            });
            this.loadCsv = true;
          } else {
            this.loadCsv = false;
          }
        } catch (e) {
          console.log('cannot automatically convert to csv.');
          console.log(e);
        }
      }
    } else {
      this.data = await response.blob();
      const blobURL = window.URL.createObjectURL(this.data);
      if (this.path && (this.path.endsWith(".mp3") || this.path.endsWith(".wav"))) {
        this.type = 'audio';
        this.data = blobURL;
      } else if (this.path && this.path.endsWith(".mp4")) {
        this.type = 'video';
        this.sourceType = 'video/mp4';
        this.data = blobURL;
      } else if (this.path && this.path.endsWith(".pdf")) {
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
