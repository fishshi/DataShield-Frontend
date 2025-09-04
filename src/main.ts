import "./assets/main.scss";

import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import router from "@/router";
import App from "./App.vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import locale from "element-plus/es/locale/lang/zh-cn";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia).use(router).use(ElementPlus, { locale }).mount("#app");
