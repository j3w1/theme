// Local, non-canonical candidate evaluation. No candidate is a public profile.
import { z } from "zod";
import { loadProfile, resolveTokens, toCss } from "./tokens.mjs";
import { readJson, readText, sha256, stableJson } from "./fs.mjs";
import { loadComponents } from "./spec.mjs";
import { loadDeclaredPairs } from "./validators.mjs";
import { tokenRefsOf } from "./spec.mjs";

export const candidateIds = ["conservative", "balanced", "maximum-legibility"];
export const candidateNames = ["A — Conservative refinement", "B — Balanced refinement", "C — Maximum legibility"];
const change = z.object({ value: z.string().regex(/^#[0-9a-f]{6}$/), reason: z.string().min(12), tradeoff: z.string().min(12) }).strict();
export const overlaySchema = z.object({
  schemaVersion: z.literal(1), baselineDigest: z.string().startsWith("sha256-"),
  id: z.enum(candidateIds), summary: z.string().min(20),
  changes: z.record(z.string(), change),
}).strict();

export const colorValue = (hex) => ({ colorSpace: "srgb", components: [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255), alpha: 1, hex });

// OKLab/OKLCH analytical coordinates; canonical values stay sRGB.
export const perceptual = ({ components }) => {
  const [r, g, b] = components.map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, bb);
  return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, C, h: C < 0.00001 ? null : (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360 };
};

export const applyOverlay = (flat, input, baselineDigest) => {
  const overlay = overlaySchema.parse(input);
  if (overlay.baselineDigest !== baselineDigest) throw new Error("Candidate baseline is stale; review the current source changes before rebasing the overlay");
  const next = new Map(flat);
  for (const [role, entry] of Object.entries(overlay.changes)) {
    const token = flat.get(role);
    if (!token || token.type !== "color") throw new Error(`Candidate role must be an existing color: ${role}`);
    if (role.startsWith("color.primitive.ansi.")) throw new Error("Historical ANSI primitives cannot be changed");
    if ((token.value?.alpha ?? 1) !== 1) throw new Error(`Opaque overlays cannot replace a translucent primitive: ${role}`);
    next.set(role, { ...token, value: colorValue(entry.value) });
  }
  // ANSI primitives alias portions of the modern ramps in the canonical source.
  // Freeze their resolved baseline bytes inside the temporary overlay so changing
  // a modern ramp cannot indirectly recolor the historical slots.
  const original = resolveTokens(flat);
  for (let i = 0; i < 16; i++) {
    const role = `color.primitive.ansi.${i}`;
    if (flat.has(role)) next.set(role, { ...flat.get(role), value: original.get(role).resolved });
  }
  return { overlay, resolved: resolveTokens(next) };
};

export const reviewBaseline = async () => {
  const manifest = await readJson("theme.json");
  const profile = manifest.profiles.find(p => p.default);
  const components = await loadComponents();
  const files = [...new Set(["theme.json", "spec/contrast.json", "spec/inventory.json", "spec/decisions.md", ...profile.tokens,
    ...components.map(c => c.file)])].sort();
  const inputs = Object.fromEntries(await Promise.all(files.map(async file => [file, sha256(await readText(file))])));
  const flat = await loadProfile(profile.tokens);
  return { manifest, components, flat, resolved: resolveTokens(flat), baselineDigest: sha256(stableJson(inputs)), inputs };
};

export const evaluateCandidate = async (baseline, input) => {
  const id = input?.id ?? "current";
  const result = input ? applyOverlay(baseline.flat, input, baseline.baselineDigest) : { resolved: baseline.resolved, overlay: null };
  const { resolved, overlay } = result;
  const pairs = await loadDeclaredPairs({ profiles: new Map([["default", resolved]]), defaultId: "default", components: baseline.components });
  const changes = [];
  const dependentFoundations = [];
  for (const [role, token] of resolved) {
    const before = baseline.resolved.get(role);
    if (toCss(token.type, token.resolved) === toCss(before.type, before.resolved)) continue;
    if (token.type !== "color") { dependentFoundations.push({ role, current: toCss(before.type, before.resolved), candidate: toCss(token.type, token.resolved) }); continue; }
    const affected = baseline.components.filter(c => tokenRefsOf(c).includes(role));
    const declaration = overlay.changes[role] ?? token.chain.map(path => overlay.changes[path]).find(Boolean);
    const previous = perceptual(before.resolved), next = perceptual(token.resolved);
    changes.push({ role, current: before.resolved.hex, candidate: token.resolved.hex,
      deltaL: next.L - previous.L, deltaC: next.C - previous.C,
      deltaHue: next.h === null || previous.h === null ? null : ((next.h - previous.h + 540) % 360) - 180,
      reason: declaration?.reason ?? "Resolved dependency changed through the candidate overlay.",
      tradeoff: declaration?.tradeoff ?? "Review the resulting component relationships in the identical specimen board.",
      components: affected.map(c => c.id), pairs: pairs.filter(p => p.fgPath === role || p.bgPath === role),
    });
  }
  const failures = pairs.filter(p => !p.pass && !p.waiver);
  const semantic = changes.filter(c => !c.role.startsWith("color.primitive."));
  return { id, resolved, report: { id, name: id === "current" ? "Current" : candidateNames[candidateIds.indexOf(id)],
    summary: overlay?.summary ?? "Unmodified canonical default on the shared review specimens.",
    baselineDigest: baseline.baselineDigest, overlayDigest: overlay ? sha256(stableJson(overlay)) : null,
    primitiveChanges: changes.length - semantic.length, semanticChanges: semantic.length,
    untouchedRoles: [...resolved.keys()].filter(role => !changes.some(c => c.role === role) && !dependentFoundations.some(c => c.role === role)),
    roleSplits: [], heritagePrimitivePolicy: "Canonical resolved ANSI values retained, including indirect aliases", reassignedRoles: Object.keys(overlay?.changes ?? {}).filter(role => !role.startsWith("color.primitive.")), dependentFoundations, waiverChanges: 0, failures, pairs, changes,
    minimumText: Math.min(...pairs.filter(p => p.kind === "text" && !p.waiver).map(p => p.ratio)),
    minimumUI: Math.min(...pairs.filter(p => p.kind === "ui" && !p.waiver).map(p => p.ratio)),
    limits: "Local candidate, not approved or agent-consumable. Numerical evidence covers declared pairs; browser and manual evidence are separate. Equal numeric contrast does not establish visual comfort. No downstream application was modified or verified.",
  } };
};
