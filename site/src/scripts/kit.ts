import { buildTaskKit, zipTaskKit } from "../../../scripts/lib/task-kit.mjs";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import { withBase } from "../lib/base";
import { copyText } from "./clipboard";
const { index, source } = JSON.parse(document.getElementById(anchorFor.kitControl("data"))!.textContent!);
const form = document.querySelector<HTMLFormElement>("[data-kit-form]")!;
const status = form.querySelector<HTMLElement>("[data-kit-status]")!;
const result = document.querySelector<HTMLElement>("[data-kit-result]")!;
let markdown = "", download: string | null = null, generation = 0;
const invalidate = () => { generation++; result.hidden = true; };
const select = (ids: string[]) => { invalidate(); form.querySelectorAll<HTMLInputElement>('[name="component"]').forEach((input) => { input.checked = ids.includes(input.value); }); };
select(new URLSearchParams(location.search).get("components")?.split(",") ?? []);
form.querySelector("[data-kit-example]")!.addEventListener("click", () => select(["text-field", "checkbox", "button", "dialog"]));
form.querySelector("[data-kit-clear]")!.addEventListener("click", () => select([]));
form.addEventListener("input", invalidate);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!source) return;
  const data = new FormData(form);
  const components = data.getAll("component") as string[];
  if (!components.length) { status.textContent = "Select at least one component."; return; }
  const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const attempt = ++generation;
  button.disabled = true; result.hidden = true; status.textContent = "Checking pinned sources and building the kit…";
  try {
    const kit = await buildTaskKit({ index, request: { ...source, profile: index.profile, components, mode: data.get("mode"), task: data.get("task"), integration: { id: data.get("integration-id"), version: data.get("integration-version"), kind: data.get("integration-kind") } }, read: async (file: string) => {
      const response = await fetch(withBase(file), { cache: "no-store" });
      if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
      return response.text();
    } });
    if (attempt !== generation) { status.textContent = "Inputs changed. Build again to package the current selection."; return; }
    markdown = kit.markdown;
    if (download) URL.revokeObjectURL(download);
    download = URL.createObjectURL(new Blob([zipTaskKit(kit.files)], { type: "application/zip" }));
    document.querySelector<HTMLAnchorElement>("[data-kit-download]")!.href = download;
    document.querySelector<HTMLTextAreaElement>("[data-kit-output]")!.value = markdown;
    const manifest = JSON.parse(kit.files["KIT.json"]);
    document.querySelector<HTMLElement>("[data-kit-summary]")!.textContent = `${components.length} components; ${manifest.tokenClosure.length} tokens including alias dependencies; ${Object.keys(kit.files).length} files. Pending decisions: ${manifest.pendingDecisionIds.join(", ") || "none"}.`;
    result.hidden = false; status.textContent = "Kit ready. Sources and digests agree at the displayed revision.";
  } catch (error) { status.textContent = `Kit could not be built: ${(error as Error).message}`; }
  finally { button.disabled = false; }
});
document.querySelector("[data-kit-copy]")!.addEventListener("click", async () => {
  status.textContent = (await copyText(markdown)) ? "Complete Markdown kit copied." : "Clipboard unavailable. Select the Markdown text or download the ZIP.";
});
