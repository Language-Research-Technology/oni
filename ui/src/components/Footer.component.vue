<template>
  <el-row class="text-center p-6 bg-gray-100  fixed bottom-0">
    <el-col :span="24">
      <span>{{ copyright }}</span>
      <a class="text-gray-600 font-semibold" href="{{href}}">{{ hrefText }}</a>
    </el-col>
  </el-row>
</template>
<script>
export default {
  name: 'FooterView',
  props: ['href', 'hrefText', 'copyright'],
  data() {
    return {}
  }
}
</script>
