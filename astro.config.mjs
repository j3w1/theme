// The site is one static page deployed under /theme/ on GitHub Pages. Every
// value on the page comes from tokens/ and spec/; Astro owns no truth. See
// spec/decisions.md D-010 and D-012, and tests/dist/ for the base-path gate.

import { defineConfig, passthroughImageService } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import copyExports from "./site/integrations/copy-exports.mjs";
import rehypeSpec from "./site/integrations/rehype-spec.mjs";
import verification from "./site/integrations/verification.mjs";
import hexSwatches from "./site/integrations/hex-swatches.mjs";
import releaseComparisons from "./site/integrations/release-comparisons.mjs";
import manifest from "./theme.json" with { type: "json" };

const siteUrl = new URL(manifest.site.url);

export default defineConfig({
  site: siteUrl.origin,
  base: manifest.site.base,
  trailingSlash: "always",
  output: "static",
  srcDir: "./site/src",
  publicDir: "./site/public",
  outDir: "./dist",
  cacheDir: "./.cache/astro",
  build: { format: "directory", assets: "_astro", inlineStylesheets: "auto" },
  image: { service: passthroughImageService() },
  vite: { build: { assetsInlineLimit: 0 } },
  devToolbar: { enabled: false },
  // The unified processor (pinned @astrojs/markdown-remark) so the heading-
  // shift and token-reference plugin can run on the spec Markdown.
  markdown: { processor: unified({ rehypePlugins: [rehypeSpec] }) },
  integrations: [copyExports(), releaseComparisons(), hexSwatches(), verification()],
});
