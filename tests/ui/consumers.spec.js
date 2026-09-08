import { test, expect } from "../browser/evidence-fixture.mjs";
const annotation = { type: "verification", description: JSON.stringify({ component: "text-field", category: "enhancements", states: ["default", "required", "invalid", "disabled", "filled"], variants: ["default"], note: "Packed artifact in isolated HTML, Vue, React and Astro applications. Native submission, validation, reset, disabled fieldset, custom-element properties and retained labels; not blanket component or manual accessibility conformance." }) };
for (const framework of ["html", "vue", "react", "astro"]) {
  test(`${framework} installs the actual packed controls and retains native form behavior`, { annotation }, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/${framework}/`);
    await page.waitForFunction(() => customElements.get("j3w1-text-field"));
    const project = page.getByLabel("Project", { exact: true });
    await expect(project).toHaveValue("Initial");
    await project.fill("");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Ready");
    expect(await project.evaluate(input => input.validity.valueMissing)).toBe(true);
    await page.locator("#field").evaluate(element => { element.value = "From the component API"; });
    await page.getByLabel("Enabled", { exact: true }).check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText('{"project":"From the component API","enabled":"yes"}');
    await page.locator("#fields").evaluate(fieldset => { fieldset.disabled = true; });
    await expect(project).toBeDisabled();
    expect(await page.locator("form").evaluate(form => [...new FormData(form)])).toEqual([]);
    await page.locator("#fields").evaluate(fieldset => { fieldset.disabled = false; });
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(project).toHaveValue("Initial");
    await expect(page.getByLabel("Enabled", { exact: true })).not.toBeChecked();
    expect(errors).toEqual([]);
  });
}
