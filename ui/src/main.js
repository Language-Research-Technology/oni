import "regenerator-runtime";
import "@/assets/tailwind.css";
import "element-plus/theme-chalk/index.css";
import "@fortawesome/fontawesome-free/js/all";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoReplaceSvg = "nest";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./routes";
import { store } from "./store";
import ElementPlus from "element-plus";
import log from "loglevel";
import prefix from "loglevel-plugin-prefix";
const level = process.env.NODE_ENV === "development" ? "debug" : "warn";
log.setLevel(level);
const prefixer = prefix.noConflict();
prefixer.reg(log);
prefixer.apply(log);
import { io } from "socket.io-client";
import HTTPService from "./http.service";

(async () => {
    let response = await fetch("/api/configuration");
    if (response.status === 200) {
        let configuration = await response.json();
        store.commit("saveConfiguration",  {...configuration});
        // Vue.config.productionTip = false;

        const app = createApp(App);
        app.use(store);
        app.use(router);
        app.use(ElementPlus);
        app.config.globalProperties.$http = new HTTPService();
        app.config.globalProperties.$log = log;
        app.mount("#app");
        // app.config.globalProperties.$socket = io();
    }
})();
