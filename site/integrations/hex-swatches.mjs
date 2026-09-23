/* After the build, every human-visible hex literal on the decorated routes
   receives its inline colour swatch (D-014). scripts/lib/hex-routes.mjs
   names the routes, so design mode's live proxy decorates the same set. */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { decorateHexHtml } from "../../scripts/lib/hex-html.mjs";
import { tokenColorIndex } from "../../scripts/lib/hex-literals.mjs";
import { HEX_DECORATION } from "../../scripts/lib/hex-routes.mjs";
import { readJson } from "../../scripts/lib/fs.mjs";

export default function hexSwatches() {
  return {
    name: "j3w1-inline-hex",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const tokens = await readJson("exports/tokens.resolved.json");
        const index = tokenColorIndex(tokens.profiles);
        const decoratePage = async (file, colours) => writeFile(file, decorateHexHtml(await readFile(file, "utf8"), colours));
        const decorateTree = async (folder, colours) => {
          for (const entry of await readdir(folder, { withFileTypes: true })) {
            const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), folder);
            if (entry.isDirectory() && entry.name !== HEX_DECORATION.skipDirectory) await decorateTree(file, colours);
            else if (entry.name.endsWith(".html")) await decoratePage(file, colours);
          }
        };
        for (const page of HEX_DECORATION.pages) await decoratePage(new URL(page, dir), index);
        for (const tree of HEX_DECORATION.trees) await decorateTree(new URL(tree, dir), index);
        // Historical literals retain their exact fill without today's token matches.
        for (const tree of HEX_DECORATION.historicalTrees) await decorateTree(new URL(tree, dir), {});
      },
    },
  };
}
