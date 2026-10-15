import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import manifest from "../../theme.json" with { type: "json" };
export default defineConfig({ base: `${manifest.site.base.replace(/\/$/, "")}/demo/`, plugins: [vue({ template: { compilerOptions: { isCustomElement: tag => tag.startsWith("j3w1-") } } })], build: { target: "es2022", sourcemap: false } });
