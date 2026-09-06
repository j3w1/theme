/* WCAG 2.x contrast on resolved sRGB token values.

   Luminance is computed from the float components, never re-derived from the
   hex string; a translucent foreground or background is composited over the
   surface first; the pass decision uses the unrounded ratio while the
   displayed ratio is rounded to two decimals (so 4.4996 reads 4.50 and still
   fails). */

const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export const luminance = ({ components: [r, g, b] }) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/* Composites `top` (with alpha) over `under` (assumed opaque). */
export const composite = (top, under) => {
  const a = top.alpha ?? 1;
  if (a >= 1) return top;
  const components = top.components.map((c, i) => c * a + under.components[i] * (1 - a));
  return { colorSpace: "srgb", components, alpha: 1, hex: toHex(components) };
};

export const toHex = (components) => `#${components.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;

export const ratio = (fg, bg) => {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

export const round2 = (n) => Math.round(n * 100) / 100;

/* Evaluates one declared pair of resolved colour values. `surface` is the
   opaque colour behind a translucent background, when known. */
export const evaluatePair = ({ fg, bg, min = 4.5, kind = "text", surface = null, label = null, state = null, waiver = null }) => {
  const bgOpaque = (bg.alpha ?? 1) < 1 && surface ? composite(bg, surface) : bg;
  const fgOpaque = (fg.alpha ?? 1) < 1 ? composite(fg, bgOpaque) : fg;
  const value = ratio(fgOpaque, bgOpaque);
  return {
    label,
    state,
    kind,
    min,
    fg: fgOpaque.hex,
    bg: bgOpaque.hex,
    ratio: value,
    display: round2(value).toFixed(2),
    pass: value >= min,
    waiver,
  };
};
