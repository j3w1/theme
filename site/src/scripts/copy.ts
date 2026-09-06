/* Copy buttons: [data-copy] copies a literal value; [data-copy-brief] fetches
   the committed brief text and copies it verbatim, so what the page copies
   is exactly what is in exports/components/<id>.brief.txt. */

const flash = (button: HTMLElement, ok: boolean) => {
  const label = button.textContent;
  button.dataset.copied = ok ? "true" : "false";
  button.textContent = ok ? "copied" : "copy failed";
  window.setTimeout(() => {
    delete button.dataset.copied;
    button.textContent = label;
  }, 1500);
};

const write = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const initCopy = (): void => {
  document.addEventListener("click", async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-copy], [data-copy-brief]");
    if (!button) return;
    if (button.dataset.copy !== undefined) {
      flash(button, await write(button.dataset.copy));
      return;
    }
    const url = button.dataset.copyBrief;
    if (!url) return;
    try {
      const text = await (await fetch(url)).text();
      flash(button, await write(text));
    } catch {
      flash(button, false);
    }
  });
};
