import { readFile, writeFile, readdir } from "node:fs/promises";
import { decorateHexHtml } from "../../scripts/lib/hex-html.mjs";
import { tokenColorIndex } from "../../scripts/lib/hex-literals.mjs";

export default function hexSwatches() {
  return {
    name: "j3w1-inline-hex",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const tokens = JSON.parse(await readFile(new URL("../../exports/tokens.resolved.json", import.meta.url), "utf8"));
        const page = new URL("index.html", dir);
        await writeFile(page, decorateHexHtml(await readFile(page, "utf8"), tokenColorIndex(tokens.profiles)));
        const decorateTools = async (folder) => {
          for (const entry of await readdir(folder, { withFileTypes: true })) {
            const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), folder);
            if (entry.isDirectory()) await decorateTools(file);
            else if (entry.name.endsWith(".html")) await writeFile(file, decorateHexHtml(await readFile(file, "utf8"), tokenColorIndex(tokens.profiles)));
          }
        };
        await decorateTools(new URL("tokens/", dir));
        await decorateTools(new URL("recipes/", dir));
        await decorateTools(new URL("kit/", dir));
        await decorateTools(new URL("workbench/", dir));
        await decorateTools(new URL("preview/", dir));
      },
    },
  };
}
