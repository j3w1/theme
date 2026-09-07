/* DTCG 2025.10 token loading and resolution.

   Files are trees of groups; a token is any node with `$value`. `$type` is
   inherited from the nearest ancestor group when a token does not declare it.
   Aliases are `{path.to.token}` strings; the project resolves them across all
   files of a profile (the format only shows same-file references, so this is
   documented as a project convention in theme.json). Profile files may only
   override paths that already exist in the base set. */

import { z } from "zod";
import { readJson } from "./fs.mjs";
import { ALIAS, EXTENSIONS_KEY, TOKEN_TYPES, tokenFileSchema, valueSchemaFor } from "../../schemas/tokens.mjs";
import { eligibilityOf } from "./eligibility.mjs";

export class TokenError extends Error {}

const RESERVED = new Set(["$type", "$value", "$description", "$extensions", "$deprecated", "$root"]);

export const cssVar = (path) => `--${path.replaceAll(".", "-")}`;

export const aliasTarget = (value) => (typeof value === "string" && ALIAS.test(value) ? value.slice(1, -1) : null);

/* Flattens one file into path → declaration, applying group $type inheritance. */
export const flattenTree = (tree, file, { prefix = [], inheritedType = null, out = new Map() } = {}) => {
  const type = tree.$type ?? inheritedType;
  if ("$value" in tree) {
    const path = prefix.join(".");
    if (out.has(path)) throw new TokenError(`${file}: duplicate token ${path}`);
    out.set(path, {
      path,
      file,
      type,
      declaredType: tree.$type ?? null,
      value: tree.$value,
      description: tree.$description ?? null,
      extensions: tree.$extensions ?? null,
      deprecated: tree.$deprecated ?? false,
    });
    return out;
  }
  for (const [key, child] of Object.entries(tree)) {
    if (RESERVED.has(key)) continue;
    flattenTree(child, file, { prefix: [...prefix, key], inheritedType: type, out });
  }
  return out;
};

export const loadTokenFile = async (relative) => {
  const raw = await readJson(relative);
  const parsed = tokenFileSchema(z).safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new TokenError(`${relative} is not a valid token file:\n${issues}`);
  }
  return flattenTree(raw, relative);
};

/* Loads the files of a profile in order. Files under tokens/profiles/ may
   only override paths that the base files already define. */
export const loadProfile = async (files) => {
  const merged = new Map();
  const basePaths = new Set();
  for (const file of files) {
    const flat = await loadTokenFile(file);
    const isProfile = file.startsWith("tokens/profiles/");
    for (const [path, decl] of flat) {
      if (isProfile) {
        if (!basePaths.has(path)) throw new TokenError(`${file}: ${path} is not defined by the base token files; profiles may only override existing roles`);
      } else if (merged.has(path)) {
        throw new TokenError(`${file}: ${path} already defined in ${merged.get(path).file}`);
      }
      merged.set(path, { ...decl, overrides: isProfile ? merged.get(path) : null });
      if (!isProfile) basePaths.add(path);
    }
  }
  return merged;
};

/* Resolves every alias, following chains and detecting cycles. Returns a new
   Map path → { ...decl, type, resolved, chain }. */
export const resolveTokens = (flat) => {
  const resolved = new Map();
  const visiting = new Set();

  const resolvePath = (path, trail) => {
    if (resolved.has(path)) return resolved.get(path);
    const decl = flat.get(path);
    if (!decl) throw new TokenError(`${trail.at(-1) ?? "?"} references unknown token {${path}}`);
    if (visiting.has(path)) throw new TokenError(`alias cycle: ${[...trail, path].join(" → ")}`);
    visiting.add(path);
    const chain = [];
    let type = decl.type;
    let value = decl.value;
    const target = aliasTarget(value);
    if (target) {
      const targetToken = resolvePath(target, [...trail, path]);
      chain.push(target, ...targetToken.chain);
      value = targetToken.resolved;
      if (type && targetToken.type && type !== targetToken.type) {
        throw new TokenError(`${path} (${type}) aliases {${target}} of type ${targetToken.type}`);
      }
      type = type ?? targetToken.type;
    } else if (type && ["border", "typography", "shadow"].includes(type) && value && typeof value === "object") {
      const parts = {};
      for (const [part, partValue] of Object.entries(value)) {
        const partTarget = aliasTarget(partValue);
        parts[part] = partTarget ? resolvePath(partTarget, [...trail, path]).resolved : partValue;
        if (partTarget) chain.push(partTarget);
      }
      value = parts;
    }
    if (!type) throw new TokenError(`${path} has no $type and inherits none`);
    if (!TOKEN_TYPES.includes(type)) throw new TokenError(`${path} has unsupported type ${type}`);
    const check = valueSchemaFor(z, type).safeParse(value);
    if (!check.success) {
      throw new TokenError(`${path} (${type}) has an invalid resolved value: ${check.error.issues.map((i) => i.message).join("; ")}`);
    }
    visiting.delete(path);
    const entry = { ...decl, type, resolved: value, aliasOf: target, chain };
    resolved.set(path, entry);
    return entry;
  };

  for (const path of flat.keys()) resolvePath(path, []);
  return resolved;
};

export const loadResolvedProfile = async (files) => resolveTokens(await loadProfile(files));

/* Provenance extension helper. */
export const extensionOf = (token) => token.extensions?.[EXTENSIONS_KEY] ?? null;

export const statusOf = (token) => extensionOf(token)?.status ?? "observed";

/* CSS serialization of a resolved value. */
export const toCss = (type, value) => {
  switch (type) {
    case "color": return value.alpha !== undefined && value.alpha < 1 ? rgbaCss(value) : value.hex;
    case "dimension": return `${trimNumber(value.value)}${value.unit}`;
    case "duration": return `${trimNumber(value.value)}${value.unit}`;
    case "fontFamily": return (Array.isArray(value) ? value : [value]).map(quoteFamily).join(", ");
    case "fontWeight": return String(value);
    case "number": return trimNumber(value);
    case "border": return `${toCss("dimension", value.width)} ${value.style} ${toCss("color", value.color)}`;
    case "shadow": return `${value.inset ? "inset " : ""}${toCss("dimension", value.offsetX)} ${toCss("dimension", value.offsetY)} ${toCss("dimension", value.blur)} ${toCss("dimension", value.spread)} ${toCss("color", value.color)}`;
    case "typography": return `${toCss("fontWeight", value.fontWeight)} ${toCss("dimension", value.fontSize)}/${trimNumber(value.lineHeight)} ${toCss("fontFamily", value.fontFamily)}`;
    default: throw new TokenError(`cannot serialise type ${type}`);
  }
};

const trimNumber = (n) => String(Number(n.toFixed(4)));

const quoteFamily = (family) => (/^[a-z-]+$/i.test(family) && ["monospace", "serif", "sans-serif", "system-ui", "ui-monospace"].includes(family) ? family : `"${family}"`);

const rgbaCss = (value) => {
  const [r, g, b] = value.components.map((c) => Math.round(c * 255));
  return `rgb(${r} ${g} ${b} / ${Math.round(value.alpha * 100)}%)`;
};

/* Hex → DTCG color value (authoring helper and test aid). */
export const hexToColor = (hex, alpha = 1) => {
  const h = hex.toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(h)) throw new TokenError(`bad hex ${hex}`);
  const components = [1, 3, 5].map((i) => Number((parseInt(h.slice(i, i + 2), 16) / 255).toFixed(4)));
  return alpha === 1 ? { colorSpace: "srgb", components, alpha: 1, hex: h } : { colorSpace: "srgb", components, alpha, hex: h };
};

/* Flattened export shape: path → { type, value (resolved), css, aliasOf, description, status, deprecated }. */
export const toResolvedExport = (resolved, profile = { status: "approved", default: true }) => {
  const out = {};
  for (const [path, token] of resolved) {
    out[path] = {
      type: token.type,
      value: token.resolved,
      css: toCss(token.type, token.resolved),
      aliasOf: token.aliasOf,
      description: token.description,
      status: statusOf(token),
      deprecated: token.deprecated || false,
      decisionId: extensionOf(token)?.approval?.decision ?? null,
      eligibility: eligibilityOf(profile, token, resolved),
    };
  }
  return out;
};
