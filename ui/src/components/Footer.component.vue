<template>
    <el-row class="text-center p-6 bg-gray-100">
      <el-col :span="24">
        <span>{{ copyright }}</span>&nbsp;
        <a class="text-gray-600 font-semibold" :href="href">{{ hrefText }}</a>
      </el-col>
    </el-row>
</template>
<script>
export default {
  name: 'FooterView',
  data() {
    return {
      copyright: this.$store.state.configuration.ui.footer.copyright,
      href: this.$store.state.configuration.ui.footer.link.href,
      hrefText: this.$store.state.configuration.ui.footer.link.text,
    }
  }
}
</script>
