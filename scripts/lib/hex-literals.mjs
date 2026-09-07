/* Shared literal parsing and presentation for static HTML and explicit UI
   renderers. No DOM discovery runs in the browser. Colours are data, not roles. */
export const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const parseHex = (literal) => {
  if (!/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(literal)) return null;
  let value = literal.slice(1).toLowerCase();
  if (value.length <= 4) value = [...value].map((c) => c + c).join("");
  if (value.length === 6) value += "ff";
  return { rgba: `#${value}`, alpha: Number.parseInt(value.slice(6), 16) / 255 };
};

export const hexMatches = (text) => {
  const urls = [...text.matchAll(/(?:[a-z][a-z\d+.-]*:\/\/|mailto:|(?:[\w./-]+\.[\w/-]+)#)[^\s<>"']*/gi)].map((m) => [m.index, m.index + m[0].length]);
  return [...text.matchAll(/#[\da-f]+/gi)].filter((m) => parseHex(m[0]) &&
    !/[\w#/@.-]/.test(text[m.index - 1] ?? "") &&
    !/[\w/-]/.test(text[m.index + m[0].length] ?? "") &&
    !urls.some(([start, end]) => start <= m.index && m.index < end));
};

export const tokenColorIndex = (profiles) => {
  const index = {};
  for (const [profile, { tokens }] of Object.entries(profiles)) {
    for (const [path, token] of Object.entries(tokens)) {
      if (token.type !== "color") continue;
      const color = parseHex(token.value.hex);
      if (!color) continue;
      // Compare the represented alpha exactly, never a visually similar value.
      const alpha = token.value.alpha ?? 1;
      if (alpha * 255 !== Math.round(alpha * 255)) continue;
      const rgba = color.rgba.slice(0, 7) + Math.round(alpha * 255).toString(16).padStart(2, "0");
      (index[rgba] ??= []).push({ profile, path });
    }
  }
  for (const matches of Object.values(index)) matches.sort((a, b) => a.profile.localeCompare(b.profile) || a.path.localeCompare(b.path));
  return index;
};

export const swatchHtml = (literal, index = {}) => {
  const color = parseHex(literal);
  if (!color) throw new Error("Invalid CSS hex literal");
  const matches = index[color.rgba] ?? [];
  return `<span class="hex-swatch${color.alpha < 1 ? " hex-alpha" : ""}" aria-hidden="true" data-hex="${literal}" style="--_hex-color:${literal}"${matches.length ? ` data-token-matches="${color.rgba}"` : ""}></span>`;
};

export const renderHexText = (text, index = {}) => {
  let last = 0;
  let html = "";
  for (const match of hexMatches(text)) {
    html += escapeHtml(text.slice(last, match.index));
    html += `<span class="hex-literal">${escapeHtml(match[0])}${swatchHtml(match[0], index)}</span>`;
    last = match.index + match[0].length;
  }
  return html + escapeHtml(text.slice(last));
};
