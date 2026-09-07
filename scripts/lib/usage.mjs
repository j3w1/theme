import { toResolvedExport, extensionOf, cssVar } from "./tokens.mjs";
import { tokenRefsOf } from "./spec.mjs";
import { assertPortMapping } from "../../schemas/usage.mjs";

export const pointerPart = (text) => String(text).replaceAll("~", "~0").replaceAll("/", "~1");
const location = (file, pointer) => ({ file, pointer, line: null });
const order = (a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), "en");

// Index only relationships declared in canonical sources. A shared value never
// supplies an edge or a recommendation. An absent state/part remains null.
export const buildUsageIndex = ({ manifest, profiles, components, ports = [], globalPairs = [] }) => {
  for (const port of ports) if (!manifest.profiles.some((p) => p.id === port.profile)) throw new Error(`Port ${port.id} names an unknown profile`);
  const output = { schemaVersion: 1, theme: manifest.name, version: manifest.version,
    sourcePolicy: "Source locations are relative to the pinned revision supplying this file; JSON pointers identify mappings. No external consumer is inferred.", profiles: {} };
  for (const profile of manifest.profiles) {
    const resolved = profiles.get(profile.id);
    const exported = toResolvedExport(resolved, profile);
    const tokens = {};
    for (const [path, declaration] of [...resolved].sort(([a], [b]) => a.localeCompare(b, "en"))) {
      const token = exported[path];
      tokens[path] = { path, group: path.startsWith("color.") ? path.split(".")[1] : path.split(".")[0],
        css: token.css, variable: cssVar(path), description: token.description, status: token.status,
        deprecated: token.deprecated, eligibility: token.eligibility,
        source: location(declaration.file, `/${path.split(".").map(pointerPart).join("/")}`),
        provenance: extensionOf(declaration), aliases: [...new Set(declaration.chain)], usedByAliases: [], uses: [], contrast: [], unmappedPorts: [] };
    }
    const add = (path, fields) => {
      if (!tokens[path]) throw new Error(`Usage references unknown token ${path}`);
      tokens[path].uses.push({ kind: "part", component: null, part: null, state: null, variant: null, surface: null, nativeKey: null, port: null, ...fields });
    };
    for (const token of Object.values(tokens)) for (const alias of token.aliases) {
      if (!tokens[alias]) throw new Error(`Unknown alias ${alias}`);
      tokens[alias].usedByAliases.push(token.path);
    }
    for (const component of components) {
      for (const [part, path] of Object.entries(component.tokens)) add(path, { component: component.id, part,
        variant: component.variants.find((v) => v.id === part.split(".")[0])?.id ?? null,
        source: location(component.file, `/tokens/${pointerPart(part)}`) });
      for (const [state, parts] of Object.entries(component.stateTokens)) for (const [part, path] of Object.entries(parts)) add(path, {
        kind: "state", component: component.id, part, state, surface: parts.bg ?? null,
        source: location(component.file, `/stateTokens/${pointerPart(state)}/${part}`) });
      for (const [state, parts] of Object.entries(component.stateTokens)) {
        if (!parts.bg) continue;
        for (const edge of ["fg", "border", "outline"]) {
          if (!parts[edge]) continue;
          const pair = { fg: parts[edge], bg: parts.bg, label: `${component.id} ${state} ${edge}`, state,
            source: location(component.file, `/stateTokens/${pointerPart(state)}`) };
          for (const path of new Set([pair.fg, pair.bg])) tokens[path].contrast.push(pair);
        }
      }
      for (const path of tokenRefsOf(component)) {
        if (!tokens[path]) throw new Error(`Usage references unknown token ${path}`);
        if (!tokens[path].uses.some((u) => u.component === component.id)) add(path, { kind: "prose", component: component.id, source: location(component.file, "body") });
      }
      component.contrast.forEach((pair, i) => {
        const source = location(component.file, `/contrast/${i}`);
        for (const path of new Set([pair.fg, pair.bg])) {
          tokens[path].contrast.push({ fg: pair.fg, bg: pair.bg, label: pair.label ?? null, state: pair.state ?? null, source });
          add(path, { kind: "contrast", component: component.id, state: pair.state ?? null, surface: pair.bg, source });
        }
      });
    }
    globalPairs.forEach((pair, i) => {
      const source = location("spec/contrast.json", `/pairs/${i}`);
      for (const path of new Set([pair.fg, pair.bg])) {
        add(path, { kind: "contrast", surface: pair.bg, source });
        tokens[path].contrast.push({ fg: pair.fg, bg: pair.bg, label: pair.label ?? null, state: null, source });
      }
    });
    for (const port of ports.filter((p) => p.profile === profile.id)) {
      assertPortMapping(port, Object.keys(tokens));
      for (const [path, reason] of Object.entries(port.mapping.unmapped)) tokens[path].unmappedPorts.push({ port: port.id, reason,
        source: location(`ports/${port.id}/mapping.json`, `/unmapped/${pointerPart(path)}`) });
      for (const [path, keys] of Object.entries(port.mapping.mappings)) keys.forEach((nativeKey, i) => add(path, {
        kind: "port", port: port.id, nativeKey, source: location(`ports/${port.id}/mapping.json`, `/mappings/${pointerPart(path)}/${i}`) }));
    }
    for (const token of Object.values(tokens)) {
      token.uses = [...new Map(token.uses.map((u) => [JSON.stringify(u), u])).values()].sort(order);
      token.contrast.sort(order);
      token.usedByAliases.sort();
      token.unmappedPorts.sort(order);
    }
    output.profiles[profile.id] = { status: profile.status, tokens };
  }
  return output;
};
