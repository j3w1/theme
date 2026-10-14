/* Colour representation helpers. Byte RGB and float sRGB conversions stay
   explicit so analytical callers never inherit token-authoring rounding. */
export const rgb = hex => [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16));

export const rgbToHex = channels => `#${channels.map(n => Number(n).toString(16).padStart(2, "0")).join("")}`;

export const colorValue = (hex, alpha = 1) => ({
  colorSpace: "srgb",
  components: rgb(hex).map(c => c / 255),
  alpha,
  hex,
});

/* Authoring keeps the established four-decimal token precision. */
export const hexToColor = (hex, alpha = 1) => {
  const value = colorValue(hex.toLowerCase(), alpha);
  return { ...value, components: value.components.map(c => Number(c.toFixed(4))) };
};

/* Both source tokens and resolved exports have the same colour meaning. */
export const hexOf = token => token?.type === "color" ? (token.resolved ?? token.value).hex : null;

export const rgbCssToHex = css => {
  const match = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return match ? rgbToHex(match.slice(1, 4)) : css;
};

export const componentsToHex = components => rgbToHex(components.map(c => Math.round(c * 255)));
