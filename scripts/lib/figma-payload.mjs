import { sha256, stableJson } from "./fs.mjs";
export const FIGMA_MAPPING_VERSION = 1;
export const FIGMA_SAMPLE_ROLES = ["color.surface.default", "color.text.default", "space.4", "radius.none"];
export const buildFigmaPayload = async (source, roles = FIGMA_SAMPLE_ROLES) => {
  if (!/^[a-f0-9]{40}$/.test(source.revision)) throw new Error("A full immutable theme revision is required.");
  const bytes = await source.read("exports/tokens.resolved.json"), tokens = JSON.parse(bytes), profile = tokens.profiles.default;
  if (profile.status !== "approved" || !profile.default) throw new Error("Only the approved default profile is supported.");
  const variables = new Map(), visiting = new Set(), unsupported = [];
  const map = (id, dependency = false) => {
    if (visiting.has(id)) throw new Error("Cyclic token alias.");
    if (variables.has(id)) return true;
    const token = profile.tokens[id]; if (!token) throw new Error(`Unknown token ${id}`);
    const primitive = id.startsWith("color.primitive.");
    if (token.deprecated || (token.eligibility.action === "blocked" && !(dependency && primitive))) { unsupported.push({ id, reason: "Blocked by token eligibility." }); return false; }
    let type, value, scopes;
    if (token.type === "color" && token.value.colorSpace === "srgb") {
      type = "COLOR"; const [r, g, b] = token.value.components; value = { r, g, b, a: token.value.alpha ?? 1 };
      scopes = primitive ? [] : id.startsWith("color.text.") ? ["TEXT_FILL"] : id.startsWith("color.border.") ? ["STROKE_COLOR"] : ["FRAME_FILL", "SHAPE_FILL"];
    } else if (token.type === "dimension" && /^(space|radius)\./.test(id) && token.value.unit === "px") {
      type = "FLOAT"; value = token.value.value; scopes = [id.startsWith("space.") ? "GAP" : "CORNER_RADIUS"];
    } else { unsupported.push({ id, reason: "Only sRGB colors and scalar px space/radius are mapped; no composite flattening." }); return false; }
    visiting.add(id);
    if (token.aliasOf && !map(token.aliasOf, true)) { visiting.delete(id); unsupported.push({ id, reason: "Alias target is unsupported." }); return false; }
    visiting.delete(id);
    variables.set(id, { id, name: id.replaceAll(".", "/"), type, value: token.aliasOf ? { alias: token.aliasOf } : value, resolvedValue: value, scopes, dependencyOnly: primitive, eligibility: token.eligibility }); return true;
  };
  for (const id of [...new Set(roles)].sort()) map(id);
  const payload = { schemaVersion: 1, mappingVersion: FIGMA_MAPPING_VERSION, revision: source.revision, themeVersion: tokens.version, sourceDigests: { "exports/tokens.resolved.json": sha256(bytes) }, profile: "default", collection: "j3w1/theme/default/v1", mode: "Default", variables: [...variables.values()], unsupported, excludedProfiles: Object.entries(tokens.profiles).filter(([id]) => id !== "default").map(([id, item]) => ({ id, status: item.status, reason: "Not imported or promoted to a Figma mode." })), limits: ["One collection and its existing single default mode. Additional modes are rejected.", "Only the requested roles and alias dependencies are included. Use --roles for an explicit wider selection.", "Figma stores color channel numbers using its API representation; the receipt records actual readback, with source resolved values retained for comparison.", "Fonts, typography composites, shadows, borders and other composite types are not imported.", "Local file Variables API permission is required. Team library publishing and paid-plan features are not assumed.", "One-way import only. No document-to-token writeback."] };
  return { ...payload, payloadDigest: sha256(stableJson(payload)) };
};
