import { instantiateRecipe } from "../../../scripts/lib/recipe-markup.mjs";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import { copyText } from "./clipboard";
const data = JSON.parse(document.getElementById(anchorFor.recipeSource("template"))!.textContent!);
const form = document.querySelector<HTMLFormElement>("[data-recipe-copy]")!;
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = form.querySelector<HTMLElement>("[data-recipe-status]")!;
  try {
    const prefix = new FormData(form).get("prefix") as string;
    const markup = instantiateRecipe(data.template, prefix);
    const notice = data.template.match(/^<!--[^]*?-->/)?.[0] ?? "";
    if (!(await copyText(`${notice}\n<div class="j3w1-recipe" data-density="comfortable">\n${markup}</div>\n`))) throw new Error("the clipboard is unavailable; select the markup and copy it manually");
    status.textContent = `Copied instance ${prefix}. Use another prefix for the next copy.`;
  } catch (error) { status.textContent = `Copy failed: ${(error as Error).message}`; }
});
