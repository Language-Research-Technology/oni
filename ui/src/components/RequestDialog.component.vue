<template>
  <el-dialog v-model="dialogVisible" v-on:close="this.closeDialog()" title="Request Access" width="40%" draggable>
    <el-row :gutter="10">
      <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12" >
      Contact: <br/><a class="underline" href="mailto:request-access@ldaca.edu.au">request-access@ldaca.edu.au</a>
      </el-col>
      <el-col :xs="4" :sm="4" :md="4" :lg="4" :xl="4">
        <el-divider direction="vertical" />
      </el-col>
      <el-col :xs="8" :sm="8" :md="8" :lg="8" :xl="8" >
        <el-button>
          <el-link href="/login">Login</el-link>
        </el-button>
      </el-col>
    </el-row>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">Ok</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
export default {
  props: ['dialogVisible'],
  methods: {
    closeDialog() {
      this.$emit('close');
    }
  },
  data() {
    return {}
  }
}
</script>
