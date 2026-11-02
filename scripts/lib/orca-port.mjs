/* Orca 1.4.246 data plugin. Native keys and scope selectors live in the port
   source; every colour resolves through the same canonical mapping as the
   legacy Ghostty import. No plugin code or permissions are needed. */
import { hexOf } from "./color.mjs";
import { stableJson } from "./fs.mjs";

export function orcaArtifacts(args, ghosttyConfig) {
  const { manifest, mapping, source, resolved } = args;
  const native = new Map();
  for (const [role, keys] of Object.entries(mapping.mappings)) {
    for (const key of keys) {
      if (native.has(key)) throw new Error(`ports/orca: duplicate native key ${key}`);
      native.set(key, role);
    }
  }
  const consumed = new Set();
  const color = key => {
    const role = native.get(key), token = resolved.get(role);
    const value = token && hexOf(token);
    if (!value || (token.resolved?.alpha ?? 1) !== 1) throw new Error(`ports/orca: missing opaque mapped colour ${key}`);
    consumed.add(key);
    return value;
  };
  const app = { schemaVersion: 1, base: "dark", tokens: Object.fromEntries(source.appTokens.map(key => [key, color(`app.tokens.${key}`)])), tokenColors: source.scopes.map(({ name, scope, fontStyle }) => ({ name, scope, settings: { foreground: color(`app.tokenColors.${name}.foreground`), ...(fontStyle ? { fontStyle } : {}) } })) };
  const terminal = { schemaVersion: 1, mode: "dark", terminal: Object.fromEntries(source.terminalKeys.map(key => [key, color(`terminal.${key}`)])) };
  const legacy = { mappings: {} };
  for (const [role, keys] of Object.entries(mapping.mappings)) {
    const remaining = keys.filter(key => !consumed.has(key));
    if (remaining.length) legacy.mappings[role] = remaining;
  }
  const plugin = { manifestVersion: 2, id: "j3w1-theme", name: "j3w1", version: manifest.version, description: "True-black developer theme for Orca's app, code editor and terminal.", repository: "https://github.com/j3w1/theme", license: "MIT", engines: { orca: ">=1.4.246" }, execution: "data", contributes: { themes: [{ id: "j3w1-dark", title: "j3w1", path: "app-theme.json" }], terminalThemes: [{ id: "j3w1-terminal", title: "j3w1", path: "terminal-theme.json" }] } };
  return [
    { path: "dist/config.ghostty", text: ghosttyConfig({ ...args, mapping: legacy }) },
    ...[["orca-plugin.json", plugin], ["app-theme.json", app], ["terminal-theme.json", terminal]].map(([name, value]) => ({ path: `dist/${name}`, text: stableJson(value) })),
  ];
}
