/* Emits CSS custom properties from resolved profiles.

   The default profile fills :root; every other profile emits only the roles
   whose resolved value differs, under [data-profile="<id>"]. Primitives are
   emitted too so the site's inspector can show the alias chain, but consumers
   should use roles. */

import { cssVar, toCss } from "./tokens.mjs";

const HEADER = `/* Generated from tokens/ by scripts/generate.mjs. Do not edit.
   Roles are the contract; primitives (--color-primitive-*) are exposed for
   inspection only. */`;

const declarations = (resolved, filter = () => true) => {
  const lines = [];
  for (const [path, token] of resolved) {
    if (!filter(path, token)) continue;
    lines.push(`  ${cssVar(path)}: ${toCss(token.type, token.resolved)};`);
  }
  return lines;
};

export const buildCss = ({ profiles, defaultId }) => {
  const base = profiles.get(defaultId);
  const out = [HEADER, "", ":root {", ...declarations(base), "}"];
  for (const [id, resolved] of profiles) {
    if (id === defaultId) continue;
    const changed = declarations(resolved, (path, token) => {
      const baseToken = base.get(path);
      return !baseToken || toCss(baseToken.type, baseToken.resolved) !== toCss(token.type, token.resolved);
    });
    out.push("", `[data-profile="${id}"] {`, ...changed, "}");
  }
  return `${out.join("\n")}\n`;
};

/* Density and profile attribute hooks the site relies on. */
export const buildDensityCss = (resolved) => {
  const lines = [];
  for (const mode of ["compact", "comfortable"]) {
    lines.push(`[data-density="${mode}"] {`);
    for (const key of ["control-height", "row-height", "control-padding-x", "icon", "gap"]) {
      const token = resolved.get(`density.${mode}.${key}`);
      lines.push(`  --density-${key}: ${toCss(token.type, token.resolved)};`);
    }
    lines.push("}");
  }
  return `${lines.join("\n")}\n`;
};
