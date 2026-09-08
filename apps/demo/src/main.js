import { createApp, nextTick } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import "@j3w1/ui/tokens.css";
import "@j3w1/ui/register/button";
import "@j3w1/ui/register/text-field";
import "@j3w1/ui/register/select";
import "@j3w1/ui/register/textarea";
import "@j3w1/ui/styles/button.css";
import "@j3w1/ui/styles/text-field.css";
import "@j3w1/ui/styles/select.css";
import "@j3w1/ui/styles/textarea.css";
import "./style.css";
const routes = [
  { path: "/", redirect: "/dashboards/analytics" },
  { path: "/dashboards/:kind", component: () => import("./views/Dashboard.vue") },
  { path: "/records/:kind/:id?/:action?", component: () => import("./views/Records.vue") },
  { path: "/apps/:kind", component: () => import("./views/Productivity.vue") },
  { path: "/forms/:kind", component: () => import("./views/Forms.vue") },
  { path: "/components/:id?", component: () => import("./views/Gallery.vue") },
  { path: "/pages/:kind", component: () => import("./views/Pages.vue") },
  { path: "/:pathMatch(.*)*", redirect: "/pages/not-found" },
];
const router = createRouter({ history: createWebHashHistory(), routes, scrollBehavior: () => ({ top: 0 }) });
router.afterEach(async (to, from) => { if (!from.matched.length) return; await nextTick(); document.querySelector("main h1")?.focus(); });
createApp(App).use(router).mount("#app");
