/* Before printing, open every details element so nothing supplementary is
   lost on paper; restore afterwards. */

export const initPrint = (): void => {
  const touched: HTMLDetailsElement[] = [];
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll<HTMLDetailsElement>("details:not([open])").forEach((d) => {
      d.open = true;
      touched.push(d);
    });
  });
  window.addEventListener("afterprint", () => {
    while (touched.length) touched.pop()!.open = false;
  });
};
