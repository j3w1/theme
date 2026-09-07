/* Vite supplies source bytes explicitly: no runtime path is inferred from a
   bundled import.meta.url inside Astro's prerender directory. */
import { workbenchData } from "../../../scripts/lib/workbench-data.mjs";
import bridgeSource from "./workbench.ts?raw";
const files = import.meta.glob([
  "/scripts/lib/issue-draft.mjs", "/site/src/scripts/issue-draft.ts", "/site/src/components/IssueDraft.astro",
  "/theme.json", "/site/workbench.json", "/spec/components/*.md", "/spec/components/*.demo.html",
  "/exports/tokens.resolved.json", "/exports/token-usage.json", "/schemas/playground.mjs", "/schemas/workbench.mjs",
  "/scripts/lib/workbench-*.mjs", "/scripts/lib/specimen-*.mjs", "/scripts/lib/markup.mjs", "/scripts/lib/contrast.mjs", "/scripts/lib/hex-literals.mjs",
  "/site/src/styles/components/*.css", "/site/src/styles/workbench.css", "/site/src/scripts/workbench.ts", "/site/src/scripts/preview.ts", "/site/src/scripts/specimen-behavior.ts",
  "/site/src/pages/preview/*.astro", "/site/src/pages/workbench/*.astro", "/site/src/components/Workbench.astro", "/site/src/lib/workbench.ts",
], { eager: true, query: "?raw", import: "default" }) as Record<string, string>;
export const buildWorkbenchData = (id: string) => workbenchData(id, async (file: string) => {
  const source = file === "site/src/lib/workbench.ts" ? bridgeSource : files[`/${file}`];
  if (source === undefined) throw new Error(`Workbench source is not declared in the build: ${file}`);
  return source.replaceAll("\r\n", "\n");
});
