<template>
  <button class="w-full h-12 rounded-lg text-gray-200 uppercase font-semibold text-gray-100 transition mb-4"
          :class="this.buttonClass" :disabled="this.disabled" @click="login()">
    {{ this.buttonText }}<span class="text-xs">{{ this.disabled ? '(coming soon)' : '' }}</span>
  </button>
</template>

<script>
import { loginSessionKey, putLocalStorage } from "@/components/storage";

export default {
  props: {
    disabled: {
      type: Boolean,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      required: true,
    },
    buttonClass: {
      type: String
    }
  },
  data() {
    return {
      configuration: this.$store.state.configuration.authentication[this.provider],
      scope: "openid profile email",
      loggingIn: false,
    };
  },
  mounted() {
  },
  methods: {
    async login() {
      this.loggingIn = true;
      const code_verifier = '12345';
      putLocalStorage({ key: loginSessionKey, data: { code_verifier } });
      window.location.href = `/api/auth/${ this.provider }/login`;
    }
  }
};
</script>
