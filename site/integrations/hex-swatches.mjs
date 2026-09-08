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
        const reference = new URL("reference/index.html", dir);
        await writeFile(reference, decorateHexHtml(await readFile(reference, "utf8"), tokenColorIndex(tokens.profiles)));
        const decorateTools = async (folder, index = tokenColorIndex(tokens.profiles)) => {
          for (const entry of await readdir(folder, { withFileTypes: true })) {
            const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), folder);
            if (entry.isDirectory() && entry.name !== "specimens") await decorateTools(file, index);
            else if (entry.name.endsWith(".html")) await writeFile(file, decorateHexHtml(await readFile(file, "utf8"), index));
          }
        };
        await decorateTools(new URL("tokens/", dir));
        await decorateTools(new URL("ports/", dir));
        await decorateTools(new URL("recipes/", dir));
        await decorateTools(new URL("kit/", dir));
        await decorateTools(new URL("workbench/", dir));
        await decorateTools(new URL("preview/", dir));
        // Human portal pages receive the same transform. Downloadable package,
        // copy and demo artifacts retain their original integrity-recorded bytes.
        for (const route of ["components", "foundations", "tools", "patterns", "builder", "figma", "implement", "agents"]) await decorateTools(new URL(`${route}/`, dir));
        // Historical literals retain their exact fill without today's token matches.
        // Reconstructed specimens retain their exact, digest-recorded bytes.
        await decorateTools(new URL("releases/", dir), {});
      },
    },
  };
}
