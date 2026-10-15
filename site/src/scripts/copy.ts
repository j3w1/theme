/* Copy buttons: [data-copy] copies a literal value; [data-copy-brief] fetches
   the committed brief text and copies it verbatim, so what the page copies
   is exactly what is in exports/components/<id>.brief.txt. */

import { copyWithStatus } from "./clipboard";

const brief = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Brief unavailable: ${response.status}`);
  return response.text();
};

export const initCopy = (): void => {
  document.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("[data-copy], [data-copy-brief]");
    if (!button) return;
    if (button.dataset.copy !== undefined) copyWithStatus(button.dataset.copy, { button });
    else if (button.dataset.copyBrief) copyWithStatus(() => brief(button.dataset.copyBrief!), { button });
  });
};
