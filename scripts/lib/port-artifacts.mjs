/* Writes each port's importable files from its mapping and the resolved
   profile, so a hex in ports/<id>/dist/ is never hand-edited
   (spec/portability.md). Emitters are keyed by the manifest's `format`; a
   port whose format has no emitter keeps its committed files as they are.
   Runs before the port catalogue, which hashes these bytes. */

import { stringify } from "yaml";
import { readJson, writeOrCheck } from "./fs.mjs";
import { toCss } from "./tokens.mjs";
import { validatePorts } from "./validators.mjs";

const ANSI = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];

// The keys Orca's Import from YAML reads, in the order the file lists them.
export const WARP_YAML_KEYS = ["background", "foreground", "cursor",
  ...ANSI.map((slot) => `terminal_colors.normal.${slot}`), ...ANSI.map((slot) => `terminal_colors.bright.${slot}`)];

const warpYaml = ({ manifest, port, mapping, resolved }) => {
  const values = new Map();
  for (const [role, keys] of Object.entries(mapping.mappings)) {
    const token = resolved.get(role);
    if (!token || token.type !== "color") throw new Error(`ports/${port.id}: ${role} is not a colour role`);
    for (const key of keys) {
      if (!WARP_YAML_KEYS.includes(key)) throw new Error(`ports/${port.id}: ${key} is not a key the ${port.format} emitter writes`);
      if (values.has(key)) throw new Error(`ports/${port.id}: ${key} is mapped twice`);
      values.set(key, toCss(token.type, token.resolved));
    }
  }
  const theme = { name: "j3w1 theme" };
  for (const key of WARP_YAML_KEYS) {
    if (!values.has(key)) continue;
    const parts = key.split(".");
    let node = theme;
    for (const part of parts.slice(0, -1)) node = node[part] ??= {};
    node[parts.at(-1)] = values.get(key);
  }
  return `# j3w1 theme ${manifest.version}, ${port.profile} profile, for ${port.displayName}.\n` +
    `# Generated from ports/${port.id}/mapping.json by npm run generate; do not edit.\n` +
    stringify(theme, { lineWidth: 0 });
};

export const PORT_EMITTERS = { "warp-yaml": warpYaml };

export const portArtifactsGenerator = {
  name: "port artifacts",
  async run({ manifest, profiles, check }) {
    const files = [], changed = [];
    for (const port of await validatePorts()) {
      const emit = PORT_EMITTERS[port.format];
      if (!emit) continue;
      if (port.files.length !== 1) throw new Error(`ports/${port.id}: the ${port.format} emitter writes exactly one file`);
      const mapping = await readJson(`ports/${port.id}/${port.mappingPath}`);
      const file = `ports/${port.id}/${port.files[0].path}`;
      files.push(file);
      if (await writeOrCheck(file, emit({ manifest, port, mapping, resolved: profiles.get(port.profile) }), { check })) changed.push(file);
    }
    return { files, changed, note: `${files.length} generated` };
  },
};
