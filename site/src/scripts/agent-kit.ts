import { copyText } from "./clipboard";
const root = document.querySelector<HTMLElement>("[data-agent-kit]");
if (root) {
  const form = root.querySelector<HTMLFormElement>("form")!;
  const components = form.elements.namedItem("components") as HTMLSelectElement;
  const framework = form.elements.namedItem("framework") as HTMLSelectElement;
  const mode = form.elements.namedItem("mode") as HTMLSelectElement;
  const command = root.querySelector<HTMLElement>("[data-kit-command]")!;
  const status = root.querySelector<HTMLElement>("[data-kit-status]")!;
  const requested = new URL(location.href).searchParams.getAll("component");
  if (requested.some(id => [...components.options].some(option => option.value === id))) for (const option of components.options) option.selected = requested.includes(option.value);
  const prepare = () => {
    if (framework.value === "native") mode.value = "mapping";
    if (!form.reportValidity()) return;
    const ids = [...components.selectedOptions].map(option => option.value);
    command.textContent = `j3w1-ui kit --components ${ids.join(",")} --framework ${framework.value} --mode ${mode.value} --out ./vendor/j3w1/task`;
    status.textContent = `${ids.length} selected. Run with @j3w1/ui ${root.dataset.version}; the CLI verifies and writes a new directory.`;
  };
  form.addEventListener("submit", event => { event.preventDefault(); prepare(); });
  form.addEventListener("change", prepare);
  root.querySelector("[data-copy-kit]")!.addEventListener("click", async () => { status.textContent = (await copyText(command.textContent!)) ? "Command copied." : "Select the command above and copy it manually."; });
  prepare();
}
