/* Writes text to the clipboard and reports whether it worked. The clipboard
   is looked up at call time, never cached: pages may be given a different
   one after this module loads (the recipe browser test does exactly that). */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
