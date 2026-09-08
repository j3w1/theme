import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({ base: "/theme/demo/", plugins: [vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith("j3w1-") } } })], build: { target: "es2022", sourcemap: false } });
