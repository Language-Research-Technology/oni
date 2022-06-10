<template>
  <el-row align="'middle'" justify="'center'" :gutter="20" class="grid place-items-center h-screen">
    <el-col :xs="8" :sm="12" :md="12" :lg="12" :xl="12">
      <img :src="alpacaSVG" alt="Cute Alpaca"/>
      <p class="text-center text-sm">
        <el-link
                 href="https://openclipart.org/artist/Arousaland"
                 target="_blank">Image by Arousaland
        </el-link>
      </p>
    </el-col>
    <el-col :xs="16" :sm="12" :md="12" :lg="12" :xl="12" class="p-5">
      <p class="text-1xl">404 not found</p>
      <p class="text-2xl">Hi! It seems you're in the wrong page</p>
    </el-col>
  </el-row>
</template>

<script>
export default {
  data() {
    return {
      alpacaSVG: require('../assets/alpaca.svg')
    }
  }
}
</script>
