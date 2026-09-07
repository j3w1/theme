import { readFile, writeFile } from "node:fs/promises";
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
      },
    },
  };
}
