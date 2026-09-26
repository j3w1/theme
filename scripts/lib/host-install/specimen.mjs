/* The terminal specimen. ports/orca/src/specimen.json names ANSI slots,
   tokens, Claude Code roles (fgRole/bgRole, through
   ports/claude-code/host.json) and Codex scopes (fgScope/bgScope, through
   ports/codex/host.json). resolveSpecimen turns roles and scopes into the
   tokens they map to, so the generated ports/orca/install/specimen.json
   names slots and tokens only and the Windows installer needs no other
   folder. renderSpecimen draws the generated file as SGR: slots by ANSI
   number, so the terminal's own palette draws them, and tokens in 24-bit
   colour from the export. */

const ESC = "\u001b[";
const RESET = `${ESC}0m`;
/* The six attributes the terminal specification defines, nothing else. */
const ATTRS = { bold: 1, dim: 2, italic: 3, underline: 4, inverse: 7, strikethrough: 9 };

export const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

const channel = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const slotFg = (n) => (n === "default" ? 39 : n < 8 ? 30 + n : 90 + n - 8);
const slotBg = (n) => (n === "default" ? 49 : n < 8 ? 40 + n : 100 + n - 8);
const trueFg = (hex) => `38;2;${rgb(hex).join(";")}`;
const trueBg = (hex) => `48;2;${rgb(hex).join(";")}`;
const sgr = (codes) => (codes.length ? `${ESC}${codes.join(";")}m` : "");

/* Roles and scopes to tokens; every other key is kept as it is. */
export const resolveSpecimen = (source, { claude, codex }) => {
  const role = (name) => {
    if (!claude.roles[name]) throw new Error(`the specimen names ${name}, which is not a role in ports/claude-code/host.json`);
    return claude.roles[name].token;
  };
  const scope = (name, key) => {
    const entry = codex.scopes.find((s) => s.name === name);
    if (!entry?.[key]) throw new Error(`the specimen names the ${key} of Codex scope ${name}, which ports/codex/host.json does not set`);
    return entry[key];
  };
  const segment = (s) => {
    const out = {};
    for (const [key, value] of Object.entries(s)) {
      if (key === "fgRole") out.fgToken = role(value);
      else if (key === "bgRole") out.bgToken = role(value);
      else if (key === "fgScope") out.fgToken = scope(value, "foreground");
      else if (key === "bgScope") out.bgToken = scope(value, "background");
      else out[key] = value;
    }
    return out;
  };
  return {
    schemaVersion: source.schemaVersion,
    note: "Generated from ports/orca/src/specimen.json by npm run generate; do not edit. Segments name ANSI slots (0-15 or \"default\") or tokens (fgToken/bgToken, drawn as 24-bit colour). No colour values live here.",
    sections: source.sections.map((section) => (section.lines ? { ...section, lines: section.lines.map((line) => line.map(segment)) } : { ...section })),
  };
};

const RESOLVED_ONLY = ["fgRole", "bgRole", "fgScope", "bgScope"];

export const renderSpecimen = (ctx) => {
  const color = (id) => ctx.resolver.color(id);
  const bg = color("color.terminal.bg");
  const fg = color("color.terminal.fg");
  const slot = (i) => color(`color.terminal.ansi.${i}`);
  const ratio = (a, b) => {
    const r = contrast(a, b);
    return `${r.toFixed(2).padStart(5)}:1${r < 4.5 ? " ✕" : "  "}`;
  };

  const segment = (s) => {
    const unresolved = RESOLVED_ONLY.find((k) => k in s);
    if (unresolved) throw new Error(`the specimen still names ${unresolved}; run npm run generate`);
    const codes = [];
    for (const a of s.attrs ?? []) {
      if (!Object.hasOwn(ATTRS, a)) throw new Error(`specimen names attribute ${a}, which the terminal specification does not define`);
      codes.push(ATTRS[a]);
    }
    if (s.fg !== undefined) codes.push(slotFg(s.fg));
    if (s.bg !== undefined) codes.push(slotBg(s.bg));
    if (s.fgToken) codes.push(trueFg(color(s.fgToken)));
    if (s.bgToken) codes.push(trueBg(color(s.bgToken)));
    return codes.length ? `${sgr(codes)}${s.text}${RESET}` : s.text;
  };

  const generated = {
    "slot-grid": () =>
      Array.from({ length: 16 }, (_, i) => {
        const hex = slot(i);
        return `${String(i).padStart(2)}  ${sgr([slotFg(i)])}Sample text${RESET}  ${sgr([slotBg(i)])}        ${RESET}  expected ${hex}  vs bg ${ratio(hex, bg)}`;
      }),
    attributes: () => Object.entries(ATTRS).map(([name, code]) => `${sgr([code])}${name}${RESET}  ${sgr([code, 31])}${name} in slot 1${RESET}`),
    "bg-pairs": () =>
      Array.from({ length: 16 }, (_, i) => `${String(i).padStart(2)}  ${sgr([39, slotBg(i)])} default fg on slot ${String(i).padEnd(2)} ${RESET}  ${ratio(fg, slot(i))}`),
  };

  const at = ctx.theme.ref === ctx.theme.revision ? `commit ${ctx.theme.revision}` : `${ctx.theme.ref} (${ctx.theme.revision})`;
  const out = [`j3w1-theme ${ctx.theme.version} ${at} profile ${ctx.theme.profile}`, `terminal bg ${bg}  fg ${fg}; ✕ marks a ratio below 4.5:1`, ""];
  for (const section of ctx.specimen.sections) {
    out.push(`${sgr([1])}${section.title}${RESET}`);
    if (section.generated) out.push(...generated[section.generated]());
    for (const line of section.lines ?? []) out.push(line.map(segment).join(""));
    out.push("");
  }
  return `${out.join("\n")}\n`;
};
