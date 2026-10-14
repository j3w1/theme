/* The site's only clipboard writer. The clipboard is looked up at call time,
   never cached: pages may be given a different one after this module loads
   (the recipe browser test does exactly that). */
const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

type Feedback = {
  /* Reports the outcome as text in this live region. */
  status?: HTMLElement;
  /* Otherwise the button itself shows the outcome for 1.5 s. */
  button?: HTMLElement;
  copied?: string;
  failed?: string;
};

/* A button's own label, captured on its first copy. Reading the label on
   every click saved "copied" as the label when a second click came before
   the reset, and the button never recovered (R-g). */
const labels = new WeakMap<HTMLElement, { text: string; timer: number }>();

export const copyWithStatus = async (source: string | (() => Promise<string>), { status, button, copied = "copied", failed = "copy failed" }: Feedback): Promise<boolean> => {
  let ok = false;
  try {
    ok = await copyText(typeof source === "string" ? source : await source());
  } catch {
    ok = false;
  }
  const message = ok ? copied : failed;
  if (status) status.textContent = message;
  else if (button) {
    const label = labels.get(button) ?? { text: button.textContent ?? "", timer: 0 };
    window.clearTimeout(label.timer);
    button.dataset.copied = String(ok);
    button.textContent = message;
    label.timer = window.setTimeout(() => {
      delete button.dataset.copied;
      button.textContent = label.text;
      labels.delete(button);
    }, 1500);
    labels.set(button, label);
  }
  return ok;
};
