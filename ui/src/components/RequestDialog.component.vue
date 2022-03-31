<template>
  <el-dialog v-model="dialogVisible" v-on:close="this.closeDialog()" title="Request Access" width="30%" draggable>
    <span>Request Access</span>
    <pre>TODO: request form here</pre>
    <br/><br/>
    <el-button><el-link href="/login">Login</el-link></el-button>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="dialogVisible = false">Confirm</el-button>
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
