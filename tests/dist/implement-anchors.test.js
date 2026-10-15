import test from "node:test";
import assert from "node:assert/strict";
import { readText } from "../../scripts/lib/fs.mjs";

/* The implementation guide's section anchors are published links: bookmarks and
   agent briefs point at them. Condensing the guide must keep every one. */
const PUBLISHED = ["install-and-pin", "load-one-component", "vue-3-javascript-sfcs", "react-astro-and-plain-html",
  "attributes-properties-and-events", "forms-and-validation", "composition-lifecycle-and-styling",
  "copy-a-complete-bundle", "troubleshooting-and-upgrades"];

test("every published /implement/ section anchor still exists", async () => {
  const html = await readText("dist/implement/index.html");
  for (const id of PUBLISHED) assert.ok(html.includes(`id="${id}"`), id);
});
