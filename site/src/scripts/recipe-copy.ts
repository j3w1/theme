import { instantiateRecipe } from "../../../scripts/lib/recipe-markup.mjs";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import { copyWithStatus } from "./clipboard";
const data = JSON.parse(document.getElementById(anchorFor.recipeSource("template"))!.textContent!);
const form = document.querySelector<HTMLFormElement>("[data-recipe-copy]")!;
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = form.querySelector<HTMLElement>("[data-recipe-status]")!;
  const prefix = new FormData(form).get("prefix") as string;
  let markup: string;
  try {
    markup = instantiateRecipe(data.template, prefix);
  } catch (error) {
    status.textContent = `Copy failed: ${(error as Error).message}`;
    return;
  }
  const notice = data.template.match(/^<!--[^]*?-->/)?.[0] ?? "";
  await copyWithStatus(`${notice}\n<div class="j3w1-recipe" data-density="comfortable">\n${markup}</div>\n`, {
    status,
    copied: `Copied instance ${prefix}. Use another prefix for the next copy.`,
    failed: "Copy failed: the clipboard is unavailable; select the markup and copy it manually",
  });
});
