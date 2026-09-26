/* Pure generators: a context in, file contents out. No clock, no
   filesystem; the caller passes resolvedAt for the lock. The installers and
   the port emitters (scripts/lib/port-artifacts.mjs) share them, so the file
   a port publishes and the file an installer writes come from one
   implementation. A context needs `roles` (the host maps), `resolver` and
   `theme` ({ version, profile }, plus ref and revision for a lock). */

import { THEME } from "./source.mjs";

export const INTEGRATIONS = ["claude-code", "codex"];

const TOKEN_ID = /^(?:color|font)\.[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;

const tokenIds = (value, out = new Set()) => {
  if (typeof value === "string" && TOKEN_ID.test(value)) out.add(value);
  else if (Array.isArray(value)) for (const v of value) tokenIds(v, out);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) if (k !== "deviations") tokenIds(v, out);
  return out;
};

/* Every token a role map (or the specimen) consumes: any string value that
   is a whole token id, outside the deviation records. */
export const roleTokenIds = (roles) => [...tokenIds(roles)].sort();

/* use-and-report disclosures for the tokens one integration consumes. */
export const disclosures = (ctx, ids) => {
  const out = [];
  for (const id of ids) {
    const t = ctx.resolver.token(id);
    if (t.eligibility.action === "use-and-report") out.push({ token: id, decisionIds: [...t.eligibility.decisionIds], reason: t.eligibility.reason });
  }
  return out;
};

export const integrationDisclosures = (ctx, integration) => disclosures(ctx, roleTokenIds(ctx.roles[integration]));

export const claudeTheme = (ctx) => {
  const map = ctx.roles["claude-code"];
  const overrides = {};
  for (const [role, { token }] of Object.entries(map.roles)) overrides[role] = ctx.resolver.color(token);
  return { name: map.theme.name, base: map.theme.base, overrides };
};

export const claudeThemeText = (ctx) => `${JSON.stringify(claudeTheme(ctx), null, 2)}\n`;

const xml = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const plistValue = (value, indent) => {
  const pad = "\t".repeat(indent);
  if (Array.isArray(value)) return `${pad}<array>\n${value.map((v) => plistValue(v, indent + 1)).join("")}${pad}</array>\n`;
  if (value && typeof value === "object") {
    const body = Object.entries(value).map(([k, v]) => `${pad}\t<key>${xml(k)}</key>\n${plistValue(v, indent + 1)}`).join("");
    return `${pad}<dict>\n${body}${pad}</dict>\n`;
  }
  return `${pad}<string>${xml(value)}</string>\n`;
};

/* A property list of dicts, arrays and strings: all a TextMate theme holds. */
export const plist = (value) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${plistValue(value, 0)}</plist>\n`;

export const codexThemeObject = (ctx) => {
  const map = ctx.roles.codex;
  const globals = Object.fromEntries(Object.entries(map.globals).map(([key, id]) => [key, ctx.resolver.color(id)]));
  const scopes = map.scopes.map((entry) => {
    const settings = {};
    if (entry.foreground) settings.foreground = ctx.resolver.color(entry.foreground);
    if (entry.background) settings.background = ctx.resolver.color(entry.background);
    if (entry.fontStyle) settings.fontStyle = entry.fontStyle;
    return { name: entry.name, scope: entry.scope, settings };
  });
  return {
    name: map.theme.name,
    /* No commit and no clock, so the published file and an installed one
       are the same bytes. */
    comment: `j3w1 theme ${ctx.theme.version}, ${ctx.theme.profile} profile, for ${map.host.name}. Generated from ports/codex/host.json; do not edit.`,
    settings: [{ settings: globals }, ...scopes],
    uuid: map.theme.uuid,
  };
};

export const codexTmTheme = (ctx) => plist(codexThemeObject(ctx));

/* Ghostty lines in the port's order; only font-size follows the host. */
export const ghosttyConfig = (ctx, fontSize) => {
  const lines = [];
  for (const line of ctx.roles.terminal.ghostty.lines) {
    const t = ctx.resolver.token(line.token);
    let value;
    if (t.type === "color") value = ctx.resolver.color(line.token);
    else if (t.type === "fontFamily") value = line.pick === "first" ? t.value[0] : t.value.join(", ");
    else if (t.type === "dimension") value = String(t.value.value);
    else value = String(t.css);
    if (line.key === "font-size" && fontSize !== undefined) value = String(fontSize);
    lines.push(line.key === "palette" ? `palette = ${line.index}=${value}` : `${line.key} = ${value}`);
  }
  return `${lines.join("\n")}\n`;
};

export const lock = (ctx, integration, { resolvedAt }) => {
  const map = ctx.roles[integration];
  return {
    schemaVersion: 1,
    theme: THEME,
    version: ctx.theme.version,
    ref: ctx.theme.ref,
    revision: ctx.theme.revision,
    profile: ctx.theme.profile,
    integration: { ...map.integration },
    resolvedAt,
    exports: { ...ctx.exports },
    components: [...map.components],
    deviations: map.deviations.map((d) => ({ ...d })),
  };
};
