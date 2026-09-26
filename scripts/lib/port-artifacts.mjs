/* Writes each port's importable files from its mapping and the resolved
   profile, so a value in ports/<id>/dist/ is never hand-edited
   (spec/portability.md). Emitters are keyed by the manifest's `format`; a
   port whose format has no emitter keeps its committed files as they are.
   Runs before the port catalogue, which hashes these bytes.
   The Claude Code and Codex emitters call the installers' own generators
   (scripts/lib/host-install/generators.mjs) with the port's host.json, so a
   published file and an installed one come from one implementation; their
   mapping.json must agree with host.json key for key. */

import { stringify } from "yaml";
import { exists, readJson, stableJson, writeOrCheck } from "./fs.mjs";
import { toCss, toResolvedExport } from "./tokens.mjs";
import { validatePorts } from "./validators.mjs";
import { claudeThemeText, codexTmTheme } from "./host-install/generators.mjs";
import { makeResolver } from "./host-install/source.mjs";
import { resolveSpecimen } from "./host-install/specimen.mjs";

const ANSI = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];

// The keys each emitter writes, in the order the file lists them.
export const WARP_YAML_KEYS = ["accent", "cursor", "background", "foreground",
  ...ANSI.map((slot) => `terminal_colors.normal.${slot}`), ...ANSI.map((slot) => `terminal_colors.bright.${slot}`)];
export const GHOSTTY_KEYS = ["background", "foreground", "cursor-color", "cursor-text", "selection-background", "selection-foreground",
  ...Array.from({ length: 16 }, (_, i) => `palette[${i}]`), "split-divider-color", "font-family", "font-size"];

// Relative luminance of a #rrggbb colour, as Warp and Orca use it to tell dark from light.
export const luminance = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);

/* Native key → value, for the keys an emitter knows, each written once.
   `convert` turns a resolved token into the native value or throws. */
const nativeValues = ({ port, mapping, resolved }, keys, convert) => {
  const values = new Map();
  for (const [role, native] of Object.entries(mapping.mappings)) {
    const token = resolved.get(role);
    if (!token) throw new Error(`ports/${port.id}: ${role} is not in the ${port.profile} profile`);
    for (const key of native) {
      if (!keys.includes(key)) throw new Error(`ports/${port.id}: ${key} is not a key the ${port.format} emitter writes`);
      if (values.has(key)) throw new Error(`ports/${port.id}: ${key} is mapped twice`);
      values.set(key, convert(key, token, role));
    }
  }
  return values;
};
const hexOf = (port, role, token) => {
  const value = token.type === "color" ? toCss(token.type, token.resolved) : null;
  if (!/^#[0-9a-f]{6}$/.test(value ?? "")) throw new Error(`ports/${port.id}: ${role} is not an opaque colour`);
  return value;
};
const header = (manifest, port, mark = "#") =>
  `${mark} j3w1 theme ${manifest.version}, ${port.profile} profile, for ${port.displayName}.\n` +
  `${mark} Generated from ports/${port.id}/mapping.json by npm run generate; do not edit.\n`;

const warpYaml = ({ manifest, port, mapping, resolved }) => {
  const values = nativeValues({ port, mapping, resolved }, WARP_YAML_KEYS, (key, token, role) => hexOf(port, role, token));
  const theme = { name: "j3w1 theme" };
  for (const key of WARP_YAML_KEYS) {
    if (!values.has(key)) continue;
    if (key === "terminal_colors.normal.black") theme.details = luminance(values.get("background")) < 0.5 ? "darker" : "lighter";
    const parts = key.split(".");
    let node = theme;
    for (const part of parts.slice(0, -1)) node = node[part] ??= {};
    node[parts.at(-1)] = values.get(key);
  }
  return header(manifest, port) + stringify(theme, { lineWidth: 0 });
};

const ghosttyConfig = ({ manifest, port, mapping, resolved }) => {
  const values = nativeValues({ port, mapping, resolved }, GHOSTTY_KEYS, (key, token, role) => {
    if (key === "font-family") {
      if (token.type !== "fontFamily") throw new Error(`ports/${port.id}: ${role} is not a font family`);
      return [token.resolved].flat()[0];
    }
    if (key === "font-size") {
      if (token.type !== "dimension" || token.resolved.unit !== "px") throw new Error(`ports/${port.id}: ${role} is not a px size`);
      return String(token.resolved.value);
    }
    return hexOf(port, role, token);
  });
  const lines = GHOSTTY_KEYS.filter((key) => values.has(key)).map((key) => {
    const palette = /^palette\[(\d+)\]$/.exec(key);
    return palette ? `palette = ${palette[1]}=${values.get(key)}` : `${key} = ${values.get(key)}`;
  });
  return header(manifest, port) + lines.join("\n") + "\n";
};

/* The native key -> token pairs a host map writes: a Claude Code theme role
   per key, and for a TextMate theme `globals.<key>` and `<scope
   name>.foreground` / `.background`. */
export const hostEntries = (format, host) => {
  if (format === "claude-theme-json") return Object.entries(host.roles).map(([key, { token }]) => [key, token]);
  if (format === "codex-tmtheme") return [
    ...Object.entries(host.globals).map(([key, token]) => [`globals.${key}`, token]),
    ...host.scopes.flatMap((scope) => ["foreground", "background"].filter((k) => scope[k]).map((k) => [`${scope.name}.${k}`, scope[k]])),
  ];
  throw new Error(`no host map entries for format ${format}`);
};

/* mapping.json and host.json describe one file, so they must agree: every
   mapped key is a key the host map writes with that role, and every key the
   host map writes belongs to its role's mapping, or to an unmapped role whose
   reason names the key (a value the file carries that the host does not
   paint, such as a TextMate theme's editor globals in Codex). */
export const assertHostMapping = (port, mapping, entries) => {
  const written = new Map(entries);
  for (const [role, keys] of Object.entries(mapping.mappings)) {
    for (const key of keys) if (written.get(key) !== role) throw new Error(`ports/${port.id}: mapping.json maps ${role} to ${key}, but host.json writes ${written.has(key) ? written.get(key) : "nothing"} there`);
  }
  for (const [key, role] of entries) {
    if (mapping.mappings[role]?.includes(key)) continue;
    if (mapping.unmapped[role]?.includes(key)) continue;
    throw new Error(`ports/${port.id}: host.json writes ${role} at ${key}, which mapping.json neither maps nor names in the role's unmapped reason`);
  }
};

const hostContext = ({ manifest, port, host, exported }) => ({
  roles: { [port.format === "codex-tmtheme" ? "codex" : "claude-code"]: host },
  resolver: makeResolver(exported, { profile: port.profile }),
  theme: { version: manifest.version, profile: port.profile },
});

const claudeThemeJson = (args) => {
  assertHostMapping(args.port, args.mapping, hostEntries("claude-theme-json", args.host));
  return claudeThemeText(hostContext(args));
};

const codexTmThemeFile = (args) => {
  assertHostMapping(args.port, args.mapping, hostEntries("codex-tmtheme", args.host));
  return codexTmTheme(hostContext(args));
};

export const PORT_EMITTERS = { "warp-yaml": warpYaml, "ghostty-config": ghosttyConfig, "claude-theme-json": claudeThemeJson, "codex-tmtheme": codexTmThemeFile };

export const portArtifactsGenerator = {
  name: "port artifacts",
  async run({ manifest, profiles, check }) {
    const files = [], changed = [];
    for (const port of await validatePorts()) {
      const emit = PORT_EMITTERS[port.format];
      if (!emit) continue;
      if (port.files.length !== 1) throw new Error(`ports/${port.id}: the ${port.format} emitter writes exactly one file`);
      const mapping = await readJson(`ports/${port.id}/${port.mappingPath}`);
      const hostFile = `ports/${port.id}/host.json`;
      const host = (await exists(hostFile)) ? await readJson(hostFile) : null;
      const profile = manifest.profiles.find((p) => p.id === port.profile);
      const exported = toResolvedExport(profiles.get(port.profile), profile);
      const file = `ports/${port.id}/${port.files[0].path}`;
      files.push(file);
      if (await writeOrCheck(file, emit({ manifest, port, mapping, host, exported, resolved: profiles.get(port.profile) }), { check })) changed.push(file);
    }
    return { files, changed, note: `${files.length} generated` };
  },
};

/* ports/orca/install/specimen.json: the Test specimen with every Claude Code
   role and Codex scope resolved to its token, so the Windows installer reads
   one folder. Every token it names must be an eligible role of the default
   profile. */
export const SPECIMEN_SOURCE = "ports/orca/src/specimen.json";
export const SPECIMEN_FILE = "ports/orca/install/specimen.json";
export const installerSpecimenGenerator = {
  name: "installer specimen",
  async run({ manifest, profiles, defaultId, check }) {
    const specimen = resolveSpecimen(await readJson(SPECIMEN_SOURCE), { claude: await readJson("ports/claude-code/host.json"), codex: await readJson("ports/codex/host.json") });
    const resolver = makeResolver(toResolvedExport(profiles.get(defaultId), manifest.profiles.find((p) => p.id === defaultId)), { profile: defaultId });
    for (const section of specimen.sections) for (const line of section.lines ?? []) for (const segment of line) {
      for (const key of ["fgToken", "bgToken"]) if (segment[key]) resolver.color(segment[key]);
    }
    return { files: [SPECIMEN_FILE], changed: (await writeOrCheck(SPECIMEN_FILE, stableJson(specimen), { check })) ? [SPECIMEN_FILE] : [] };
  },
};
