// Native format and semantic contracts; these are not real-import evidence.
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { crc32, inflateSync } from "node:zlib";
import { unzipSync, strFromU8 } from "fflate";
import { readJson, readText, sha256 } from "../scripts/lib/fs.mjs";
import { loadResolvedProfile, toResolvedExport, hexToColor } from "../scripts/lib/tokens.mjs";
import { telegramArtifacts, telegramColor, telegramReadmeBlock, telegramPublishingBlock } from "../scripts/lib/telegram-port.mjs";
import { PORT_EMITTERS, assertPortArtifacts } from "../scripts/lib/port-artifacts.mjs";
import { assertPortMapping } from "../schemas/usage.mjs";
import { assertCapabilities } from "../schemas/port-capabilities.mjs";
import { evaluatePair } from "../scripts/lib/contrast.mjs";
import { ARTIFACTS, DESKTOP_ENTRIES, assertCloudConfig, editorUrl, installLink, readCloudConfig, validSlug } from "../ports/telegram/src/contract.mjs";

const manifest = await readJson("theme.json"), port = await readJson("ports/telegram/port.json");
const mapping = await readJson("ports/telegram/mapping.json"), capabilities = await readJson("ports/telegram/capabilities.json");
const registry = await readJson("ports/telegram/src/keys.json"), coverage = await readJson("ports/telegram/src/coverage.json");
const profile = manifest.profiles.find(p => p.id === port.profile);
const resolved = await loadResolvedProfile(profile.tokens), exported = toResolvedExport(resolved, profile);
const args = { manifest, port, mapping, resolved, exported }, artifacts = telegramArtifacts(args);
const archive = unzipSync(artifacts[1].bytes), palette = strFromU8(archive[DESKTOP_ENTRIES.palette]);
const owner = Object.fromEntries(Object.entries(mapping.mappings).flatMap(([role, keys]) => keys.map(key => [key, role])));
const android = new Map(artifacts[0].text.split("\n").filter(line => line && !line.startsWith("#")).map(line => {
  const match = /^([A-Za-z_][A-Za-z0-9_]*)=(-?\d+)$/.exec(line);
  assert.ok(match, line);
  const value = Number(match[2]);
  assert.ok(Number.isInteger(value) && value >= -2147483648 && value <= 2147483647, line);
  return [match[1], [(value >>> 16) & 255, (value >>> 8) & 255, value & 255, value >>> 24]];
}));
const desktop = new Map(palette.split("\n").filter(line => line && !line.startsWith("//")).map(line => {
  const match = /^([A-Za-z_][A-Za-z0-9_]*): (#[0-9a-f]{6}(?:[0-9a-f]{2})?);$/.exec(line);
  assert.ok(match, line);
  return [match[1], [...[1, 3, 5].map(i => parseInt(match[2].slice(i, i + 2), 16)), match[2].length === 9 ? parseInt(match[2].slice(7), 16) : 255]];
}));
const values = { android, desktop };
const parent = (target, key) => registry[target].aliases?.[key] ?? registry[target].fallbacks[key];
// Runtime value of any registry key: its own value, else its inheritance
// (Android: one fallback level; Desktop: aliases and fallbacks resolve on).
const effective = (target, key) => {
  for (let next = key, depth = 0; next && depth < 12; depth++) {
    if (values[target].has(next)) return { key: next, color: values[target].get(next), role: owner[`${target}:${next}`] };
    if (target === "android" && depth > 0) return null;
    next = parent(target, next);
  }
  return null;
};
// Contrast of a glyph on a background, one result per underlay: a translucent
// background is composited over white media and over black, never measured raw.
const contrastResults = (fg, bg, min = 4.5) => (bg[3] < 255 ? ["#ffffff", "#000000"] : [null]).map(surface =>
  ({ surface, ...evaluatePair({ fg: hexToColor(rgbHex(fg), fg[3] / 255), bg: hexToColor(rgbHex(bg), bg[3] / 255), surface: surface && hexToColor(surface), min }) }));
// Badge pairs are opaque today; a translucent badge would need its row as the
// underlay, so refuse rather than measure it uncomposited.
const pairRatio = (fgKey, bgKey, target = "desktop") => {
  const fg = effective(target, fgKey).color, bg = effective(target, bgKey).color;
  assert.equal(bg[3], 255, `${target}:${bgKey} must be opaque to be measured against its glyph`);
  return evaluatePair({ fg: hexToColor(rgbHex(fg), fg[3] / 255), bg: hexToColor(rgbHex(bg)), min: 4.5 });
};
const rgba = (target, key) => values[target].get(key) ?? values[target].get(parent(target, key));
const roleOf = (target, key) => owner[`${target}:${key}`] ?? owner[`${target}:${parent(target, key)}`];
const rgbHex = bytes => "#" + bytes.slice(0, 3).map(n => n.toString(16).padStart(2, "0")).join("");

test("Telegram registers an experimental two-artifact default-profile port", async () => {
  assert.equal(PORT_EMITTERS[port.format], telegramArtifacts);
  assert.equal(port.format, "telegram-theme"); assert.equal(port.profile, "default");
  assert.equal(port.status, "experimental"); assert.equal(port.themeVersion, manifest.version);
  assert.deepEqual(port.testedVersions, []); assert.deepEqual(port.evidence, []);
  assert.deepEqual(port.os, ["android", "windows", "linux", "macos"]);
  assert.deepEqual(port.files.map(file => file.path), Object.values(ARTIFACTS).map(file => file.path));
  assert.equal(capabilities.integrationKind, "other"); assert.equal(capabilities.verificationPath, undefined);
  assert.equal(sha256(await readFile("exports/tokens.resolved.json")), port.tokenDigest);
  assertPortArtifacts(port, artifacts);
  for (const file of artifacts) assert.deepEqual(await readFile(`ports/telegram/${file.path}`), Buffer.from(file.bytes ?? file.text));
});

test("emission is byte-identical across repeats and time zones", () => {
  assert.deepEqual(telegramArtifacts(args), artifacts);
  const source = `
    import { readJson } from './scripts/lib/fs.mjs';
    import { loadResolvedProfile, toResolvedExport } from './scripts/lib/tokens.mjs';
    import { telegramArtifacts } from './scripts/lib/telegram-port.mjs';
    const manifest=await readJson('theme.json'), port=await readJson('ports/telegram/port.json'), mapping=await readJson('ports/telegram/mapping.json');
    const profile=manifest.profiles.find(p=>p.id===port.profile), resolved=await loadResolvedProfile(profile.tokens), exported=toResolvedExport(resolved,profile);
    process.stdout.write(JSON.stringify(telegramArtifacts({manifest,port,mapping,resolved,exported}).map(f=>Buffer.from(f.bytes??f.text).toString('base64'))));
  `;
  const emit = tz => JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", source], { env: { ...process.env, TZ: tz }, encoding: "utf8" }));
  const expected = artifacts.map(file => Buffer.from(file.bytes ?? file.text).toString("base64"));
  assert.deepEqual(emit("UTC"), expected); assert.deepEqual(emit("Pacific/Kiritimati"), expected);
});

test("every token and upstream key has one classification with direct, non-redundant inheritance", () => {
  assert.equal(resolved.size, 346);
  assertPortMapping({ ...port, mapping }, resolved.keys());
  assertCapabilities({ ...port, mapping }, capabilities);
  const keys = Object.values(mapping.mappings).flat(); assert.equal(new Set(keys).size, keys.length);
  for (const [role, native] of Object.entries(mapping.mappings)) {
    assert.ok(!role.startsWith("color.primitive."), role);
    assert.ok(["use", "use-and-report"].includes(exported[role].eligibility.action), role);
    for (const name of native) {
      const [target, key] = name.split(":"); assert.ok(registry[target].keys.includes(key), name);
      const inheritedRole = owner[`${target}:${parent(target, key)}`];
      if (inheritedRole) assert.notEqual(role, inheritedRole, `redundant direct mapping ${name}`);
    }
  }
  for (const target of ["android", "desktop"]) {
    assert.equal(registry[target].keys.length, target === "android" ? 819 : 586);
    const counts = { mapped: 0, inherited: 0, unset: 0 };
    for (const key of registry[target].keys) {
      const mapped = Object.hasOwn(owner, `${target}:${key}`), inherited = !mapped && Object.hasOwn(owner, `${target}:${parent(target, key)}`), unset = Object.hasOwn(coverage[target].unset, key);
      assert.equal(Number(mapped) + Number(inherited) + Number(unset), 1, `${target}:${key}`);
      counts[mapped ? "mapped" : inherited ? "inherited" : "unset"]++;
      if (unset) { assert.ok(coverage[target].unset[key].includes(key), key); assert.ok(coverage[target].unset[key].length > 40, key); }
    }
    for (const key of Object.keys(coverage[target].unset)) assert.ok(registry[target].keys.includes(key), key);
    assert.ok(counts.mapped > 0 && counts.inherited > 0 && counts.unset > 0);
  }
  for (const role of resolved.keys()) if (role.startsWith("color.primitive.")) assert.equal(capabilities.roles[role].state, "out-of-scope", role);
  for (const [state, names] of Object.entries(port.surfaces)) assert.deepEqual(names.toSorted(), Object.entries(capabilities.surfaces).filter(([, s]) => s.state === state).map(([key]) => key).toSorted());
});

test("unknown, duplicate, nonColor, animated and ineligible keys fail before emission", () => {
  const add = (role, key) => { const clone = structuredClone(mapping); (clone.mappings[role] ??= []).push(key); return clone; };
  for (const key of ["android:not_a_key", "desktop:notAKey", "ios:windowBg", "android:chat_wallpaper:extra"]) assert.throws(() => telegramArtifacts({ ...args, mapping: add("color.text.default", key) }), /Unknown Telegram/);
  assert.throws(() => telegramArtifacts({ ...args, mapping: add("color.text.default", "android:chat_wallpaper") }), /Duplicate Telegram/);
  for (const key of [...registry.android.nonColor, ...registry.android.animated]) assert.throws(() => telegramArtifacts({ ...args, mapping: add("color.text.default", `android:${key}`) }), /nonColor\/animated/);
  const blocked = add("color.primitive.ink.0", "desktop:windowBg");
  assert.throws(() => telegramArtifacts({ ...args, mapping: blocked }), /eligible semantic role/);
  const noRole = structuredClone(mapping); delete noRole.mappings["color.text.default"];
  assert.throws(() => telegramArtifacts({ ...args, mapping: noRole }), /each role exactly once/);
  const badExport = structuredClone(exported); badExport["color.text.default"].eligibility.action = "blocked";
  assert.throws(() => telegramArtifacts({ ...args, exported: badExport }), /eligible semantic role/);
  const wrongType = new Map(resolved); wrongType.set("color.text.default", resolved.get("space.4"));
  assert.throws(() => telegramArtifacts({ ...args, resolved: wrongType }), /requires color/);
});

test("unsupported colour syntax, spaces, components and alpha values are rejected", () => {
  for (const bad of ["#fff", "#123456ff", "red", "rgba(1, 2, 3, .5)", "rgb(256 0 0 / 12%)", "rgb(0 0 0 / 101%)", "rgb(0 0 0 / -1%)", "hsl(0 0% 0%)", null]) assert.throws(() => telegramColor(bad), /malformed or unsupported colour/);
  for (const bad of [{ ...resolved.get("color.text.default").resolved, hex: "invalid" }, { ...resolved.get("color.text.default").resolved, alpha: -1 }, { ...resolved.get("color.text.default").resolved, alpha: 2 }, { ...resolved.get("color.text.default").resolved, components: [1, 0, 2] }, { ...resolved.get("color.text.default").resolved, colorSpace: "display-p3" }]) {
    const changed = new Map(resolved); changed.set("color.text.default", { ...resolved.get("color.text.default"), resolved: bad });
    assert.throws(() => telegramArtifacts({ ...args, resolved: changed }), /malformed or unsupported colour/);
  }
});

test("ARGB and Desktop RGBA preserve canonical values and alpha without derivation", () => {
  for (const [role, names] of Object.entries(mapping.mappings)) for (const native of names) {
    const [target, key] = native.split(":"), token = resolved.get(role).resolved;
    const expected = [...token.components.map(c => Math.round(c * 255)), Math.round((token.alpha ?? 1) * 255)];
    assert.deepEqual(values[target].get(key), expected, native);
  }
  assert.equal(android.get("chat_wallpaper")[3], 255);
  assert.match(artifacts[0].text, /chat_wallpaper=-16777216\n/);
  assert.deepEqual(desktop.get("msgSelectOverlay"), [145, 20, 16, 31]);
  assert.ok(palette.includes("msgSelectOverlay: #9114101f;"));
  assert.ok(palette.includes("layerBg: #000000a6;"));
  for (const target of ["android", "desktop"]) {
    assert.deepEqual([...values[target].keys()], registry[target].keys.filter(key => Object.hasOwn(owner, `${target}:${key}`)));
    for (const key of [...registry[target].translucentDefault, ...coverage[target].translucent]) {
      if (coverage[target].unset[key] || coverage[target].opaqueAllowed?.[key]) continue;
      // Emitted overlays stay translucent. A key that inherits through an
      // upstream fallback takes that key's value at runtime, which is only
      // acceptable for text and icon glyphs (upstream's own fallback design).
      if (values[target].has(key) || !/Text|Icon/.test(key)) assert.ok(rgba(target, key)[3] < 255, `${target}:${key}`);
    }
    // The only opaque exceptions are reviewed text keys, set from text roles.
    for (const [key, reason] of Object.entries(coverage[target].opaqueAllowed ?? {})) {
      assert.match(key, /Text|comment/, `${target}:${key} is a text key`);
      assert.match(roleOf(target, key), /^color\.(text|code\.syntax)\./, `${target}:${key}`);
      assert.ok(reason.length > 20);
    }
  }
  const opaque = structuredClone(mapping), key = "desktop:msgSelectOverlay";
  opaque.mappings["color.interaction.marquee"] = opaque.mappings["color.interaction.marquee"].filter(native => native !== key);
  opaque.mappings["color.text.default"].push(key);
  assert.throws(() => telegramArtifacts({ ...args, mapping: opaque }), /translucent overlay cannot be opaque/);
  assert.ok(artifacts[0].text.endsWith("\n") && palette.endsWith("\n"));
  assert.doesNotMatch(artifacts[0].text + palette, /\r|\b[0-9a-f]{40}\b|\d{4}-\d{2}-\d{2}/);
  for (const line of artifacts[0].text.split("\n").filter(line => line.startsWith("#"))) assert.doesNotMatch(line, /=|^WPS|^WLS/);
});

test("Desktop zip has ordered STORED entries, fixed metadata and a minimal valid RGB PNG", () => {
  assert.deepEqual(Object.keys(archive), Object.values(DESKTOP_ENTRIES));
  const zip = Buffer.from(artifacts[1].bytes), local = [], central = [];
  let at = 0;
  while (zip.readUInt32LE(at) === 0x04034b50) {
    assert.equal(zip.readUInt16LE(at + 8), 0, "STORED method");
    assert.equal(zip.readUInt16LE(at + 10), 0); assert.equal(zip.readUInt16LE(at + 12), 33);
    const size = zip.readUInt32LE(at + 18), nameSize = zip.readUInt16LE(at + 26), extra = zip.readUInt16LE(at + 28);
    local.push(zip.toString("utf8", at + 30, at + 30 + nameSize)); at += 30 + nameSize + extra + size;
  }
  while (zip.readUInt32LE(at) === 0x02014b50) {
    assert.equal(zip[at + 5], 3, "Unix OS"); assert.equal(zip.readUInt16LE(at + 10), 0);
    assert.equal(zip.readUInt32LE(at + 38), 0o644 << 16);
    const nameSize = zip.readUInt16LE(at + 28), extra = zip.readUInt16LE(at + 30), comment = zip.readUInt16LE(at + 32);
    central.push(zip.toString("utf8", at + 46, at + 46 + nameSize)); at += 46 + nameSize + extra + comment;
  }
  assert.deepEqual(local, Object.values(DESKTOP_ENTRIES)); assert.deepEqual(central, local);
  const png = Buffer.from(archive[DESKTOP_ENTRIES.background]);
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const chunks = []; at = 8;
  while (at < png.length) {
    const size = png.readUInt32BE(at), type = png.toString("ascii", at + 4, at + 8), data = png.subarray(at + 8, at + 8 + size);
    assert.equal(png.readUInt32BE(at + 8 + size), crc32(png.subarray(at + 4, at + 8 + size)), type);
    chunks.push({ type, data }); at += 12 + size;
  }
  assert.equal(at, png.length); assert.deepEqual(chunks.map(c => c.type), ["IHDR", "IDAT", "IEND"]);
  const ihdr = chunks[0].data;
  assert.equal(ihdr.length, 13); assert.equal(ihdr.readUInt32BE(0), 1); assert.equal(ihdr.readUInt32BE(4), 2);
  assert.deepEqual([...ihdr.subarray(8)], [8, 2, 0, 0, 0]);
  assert.equal(chunks[1].data[2] & 6, 0, "stored zlib block"); assert.equal(chunks[2].data.length, 0);
  assert.deepEqual([...inflateSync(chunks[1].data)], [0, ...android.get("chat_wallpaper").slice(0, 3), 0, ...android.get("chat_wallpaper_gradient_to").slice(0, 3)]);
});

test("wallpaper, solid bubbles, rose messages, chrome emphasis and avatars keep the requested hierarchy", () => {
  assert.equal(roleOf("android", "chat_wallpaper"), "color.surface.canvas");
  assert.equal(roleOf("android", "chat_wallpaper_gradient_to"), "color.surface.chrome");
  const wallpaper = [android.get("chat_wallpaper"), android.get("chat_wallpaper_gradient_to")];
  for (const [target, incoming, outgoing, inSelected, outSelected] of [["android", "chat_inBubble", "chat_outBubble", "chat_inBubbleSelected", "chat_outBubbleSelected"], ["desktop", "msgInBg", "msgOutBg", "msgInBgSelected", "msgOutBgSelected"]]) {
    assert.equal(roleOf(target, incoming), "color.surface.raised"); assert.equal(roleOf(target, outgoing), "color.surface.overlay");
    // Bubbles must stand out from each other, from their selected state and
    // from both wallpaper colours, or they vanish into the chat background.
    const fills = [incoming, outgoing, inSelected, outSelected].map(key => JSON.stringify(rgba(target, key)));
    assert.equal(new Set(fills.slice(0, 3)).size, 3, `${target}: incoming, outgoing and selected fills differ`);
    assert.notEqual(fills[1], fills[3], `${target}: outgoing differs from its selected state`);
    for (const key of [incoming, outgoing]) for (const end of wallpaper) assert.notDeepEqual(rgba(target, key), end, `${target}:${key} differs from the wallpaper`);
    // Lightness ladder: wallpaper < incoming < outgoing, so both bubbles read
    // as raised shapes over the whole wallpaper gradient.
    const luminance = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    assert.ok(Math.max(...wallpaper.map(luminance)) < luminance(rgba(target, incoming)), `${target}: incoming is lighter than the wallpaper`);
    assert.ok(luminance(rgba(target, incoming)) < luminance(rgba(target, outgoing)), `${target}: outgoing is lighter than incoming`);
  }
  for (const [target, keys] of [["android", ["chat_messageTextIn", "chat_messageTextOut", "chat_messagePanelText", "chat_inReplyMessageText", "chat_outReplyMessageText"]], ["desktop", ["historyTextInFg", "historyTextOutFg", "historyComposeAreaFg", "msgInMonoFg", "msgOutMonoFg"]]]) for (const key of keys) assert.equal(roleOf(target, key), "color.text.default", key);
  for (const key of registry.android.keys.filter(key => key.startsWith("chat_outBubbleGradient"))) { assert.ok(coverage.android.unset[key]); assert.ok(!android.has(key)); }
  for (const key of [...registry.android.nonColor, ...registry.android.animated]) assert.ok(!android.has(key), key);
  for (const key of registry.android.keys.filter(key => /^avatar_background/.test(key))) assert.match(roleOf("android", key), /^color\.action\.primary\.(bg|hover-bg|pressed-bg)$/);
  for (const key of ["windowBoldFg", "windowBoldFgOver", "dialogsNameFg", "boxTitleFg"]) assert.equal(roleOf("desktop", key), "color.text.bright", key);
  assert.equal(roleOf("android", "actionBarDefaultTitle"), "color.text.bright");
  for (const key of registry.android.keys.filter(key => /^windowBackgroundWhiteGray(?:Text\d*|Icon)$/.test(key))) assert.equal(roleOf("android", key), "color.text.muted", key);
  for (const key of registry.android.keys.filter(key => /^windowBackgroundWhiteBlue(?:Text\d*|Icon|Button)$/.test(key))) assert.equal(roleOf("android", key), "color.text.accent-strong", key);
  assert.equal(roleOf("android", "voipgroup_lastSeenTextUnscrolled"), "color.text.subtle");
  assert.equal(roleOf("android", "voipgroup_mutedIconUnscrolled"), "color.text.muted");
});

test("near-white is restricted to approved on-fill or link-hover roles, and interface hues stay red/rose", () => {
  const whiteRoles = ["color.text.on-selection", "color.interaction.selection.text", "color.text.on-action", "color.text.on-danger", "color.status.danger.on-fill", "color.text.link-hover"];
  // Near-white by relative luminance, not by literal value, so a token change
  // cannot silently widen it. Bright rose (text.bright) stays well below.
  const luminance = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  // Fills a near-white glyph may sit on, plus the dark media scrim behind
  // loader icons over photos.
  const fills = new Set(["color.action.primary.bg", "color.action.primary.hover-bg", "color.action.primary.pressed-bg", "color.interaction.selection.bg", "color.interaction.selection.inactive-bg", "color.interaction.hover.bg-strong", "color.status.danger.fill", "color.interaction.text-selection.bg", "color.surface.backdrop"]);
  for (const target of ["android", "desktop"]) {
    // Every near-white key, emitted or inherited, is on the reviewed table
    // naming the backgrounds it is drawn on, and nothing else is near-white.
    const near = registry[target].keys.filter(key => { const e = effective(target, key); return e && luminance(e.color) > 0.6; }).sort();
    assert.deepEqual(near, Object.keys(coverage[target].nearWhite).sort(), `${target} near-white keys`);
    for (const [key, backgrounds] of Object.entries(coverage[target].nearWhite)) {
      assert.ok(backgrounds.length, `${target}:${key} names its backgrounds`);
      assert.ok(whiteRoles.includes(effective(target, key).role), `${target}:${key}: ${effective(target, key).role}`);
      for (const bg of backgrounds) {
        assert.ok(registry[target].keys.includes(bg), `${target}:${bg} is a registry key`);
        const fill = effective(target, bg), fg = effective(target, key).color;
        assert.ok(fill && fills.has(fill.role), `${target}:${key} sits on ${bg} (${fill?.role ?? "host default"}), not a fill`);
        for (const result of contrastResults(fg, fill.color)) assert.ok(result.pass, `${target}:${key} on ${bg}${result.surface ? ` over ${result.surface}` : ""}: ${result.ratio}`);
      }
    }
  }
  for (const [native, role] of Object.entries(owner)) {
    const [target, key] = native.split(":"), color = rgba(target, key), hex = rgbHex(color);
    if (luminance(color) > 0.6) {
      assert.ok(whiteRoles.includes(role), `${native}: ${role}`);
      continue; // Explicitly allowed near-white roles have no interface hue assignment.
    }
    if (/^color\.(status|code|terminal|chart|diagnostic)\./.test(role)) continue;
    const [r, g, b] = color.slice(0, 3).map(n => n / 255), max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    if (delta === 0) continue;
    const hue = ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60 + 360) % 360;
    assert.ok(hue <= 15 || hue >= 330, `${native}: ${hex}, hue ${hue}`);
  }
});

test("compositing matters: a translucent scrim is never measured as its raw colour", () => {
  // Counterexample from review delta 2: near-white over a 55% black scrim on
  // white media passes uncomposited but fails once composited.
  const fg = hexToColor("#f4eeee"), scrim = hexToColor("#000000", 0.55);
  assert.equal(evaluatePair({ fg, bg: scrim, min: 4.5 }).pass, true);
  assert.equal(evaluatePair({ fg, bg: scrim, surface: hexToColor("#ffffff"), min: 4.5 }).pass, false);
  // The helper the near-white check uses must reject it (review delta 3, D3).
  const results = contrastResults([244, 238, 238, 255], [0, 0, 0, Math.round(0.55 * 255)]);
  assert.deepEqual(results.map(r => r.surface), ["#ffffff", "#000000"]);
  assert.equal(results.every(r => r.pass), false);
});

test("Desktop chat-list badges keep 4.5:1 in every family and row state", () => {
  // tdesktop d8594c01 ui/unread_badge_paint.cpp: the count or icon uses one
  // foreground per row state, while each badge family picks one of six
  // backgrounds by (muted, row state). Draft text and poll icons reuse two of
  // those backgrounds on the plain rows (dialogs_layout.cpp/.style).
  const foreground = ["dialogsUnreadFg", "dialogsUnreadFgOver", "dialogsUnreadFgActive"];
  const families = {
    unread: ["dialogsUnreadBg", "dialogsUnreadBgOver", "dialogsUnreadBgActive", "dialogsUnreadBgMuted", "dialogsUnreadBgMutedOver", "dialogsUnreadBgMutedActive"],
    reaction: ["dialogsDraftFg", "dialogsDraftFgOver", "dialogsDraftFgActive", "dialogsUnreadBgMuted", "dialogsUnreadBgMutedOver", "dialogsUnreadBgMutedActive"],
    poll: ["dialogsPollIconFg", "dialogsPollIconFg", "dialogsPollIconFg", "dialogsUnreadBgMuted", "dialogsUnreadBgMutedOver", "dialogsUnreadBgMutedActive"],
  };
  for (const [family, backgrounds] of Object.entries(families)) backgrounds.forEach((bg, index) => {
    const fg = foreground[index % 3], result = pairRatio(fg, bg);
    assert.ok(result.pass, `${family} badge: ${fg} on ${bg}: ${result.ratio}`);
  });
  // The mention badge in the narrow list draws on the unread pill (above).
  const rows = ["dialogsBg", "dialogsBgOver", "dialogsBgActive"];
  ["dialogsDraftFg", "dialogsDraftFgOver", "dialogsDraftFgActive"].forEach((fg, index) => assert.ok(pairRatio(fg, rows[index]).pass, `${fg} on ${rows[index]}`));
  // Every pill, and the count-less unread dot, stands out from its row at 3:1.
  for (const backgrounds of Object.values(families)) backgrounds.forEach((pill, index) => {
    const result = pairRatio(pill, rows[index % 3]);
    assert.ok(result.ratio >= 3, `${pill} pill on ${rows[index % 3]}: ${result.ratio}`);
  });
  // Wide icons drawn straight on the rows (dialogs.style, dialogs_layout.style):
  // unmuted mention/reaction/poll icons on normal and hover rows, the active
  // glyph (dialogsNameFgActive) on the active row, and the muted glyph set
  // (the muted pill colours, also used by the mute/pin/lock icons) on all rows.
  for (const icon of ["dialogsMentionIconFg", "dialogsReactionIconFg", "dialogsPollIconFg"]) for (const row of rows.slice(0, 2)) assert.ok(pairRatio(icon, row).ratio >= 3, `${icon} on ${row}`);
  assert.ok(pairRatio("dialogsNameFgActive", "dialogsBgActive").ratio >= 3, "active wide glyph");
  ["dialogsUnreadBgMuted", "dialogsUnreadBgMutedOver", "dialogsUnreadBgMutedActive"].forEach((icon, index) => assert.ok(pairRatio(icon, rows[index]).ratio >= 3, `${icon} glyph on ${rows[index]}`));
});

test("main native text/background pairs pass 4.5:1 without rounding", () => {
  const pairs = {
    android: [["chat_messageTextIn", "chat_inBubble"], ["chat_messageTextOut", "chat_outBubble"], ["chat_inTimeText", "chat_inBubble"], ["chat_outTimeText", "chat_outBubble"], ["chat_inReplyMessageText", "chat_inBubble"], ["chat_outReplyMessageText", "chat_outBubble"], ["chat_messageLinkIn", "chat_inBubble"], ["chat_messageLinkOut", "chat_outBubble"], ["chats_name", "windowBackgroundWhite"], ["chats_message", "windowBackgroundWhite"], ["chat_messagePanelText", "chat_messagePanelBackground"], ["dialogTextBlack", "dialogBackground"], ["windowBackgroundWhiteBlackText", "windowBackgroundWhite"]],
    desktop: [["historyTextInFg", "msgInBg"], ["historyTextOutFg", "msgOutBg"], ["msgInDateFg", "msgInBg"], ["msgOutDateFg", "msgOutBg"], ["historyLinkInFg", "msgInBg"], ["historyLinkOutFg", "msgOutBg"], ["dialogsNameFg", "dialogsBg"], ["dialogsTextFg", "dialogsBg"], ["historyComposeAreaFg", "historyComposeAreaBg"], ["boxTextFg", "boxBg"], ["windowFg", "windowBg"], ["historyTextInFgSelected", "msgInBgSelected"], ["historyTextOutFgSelected", "msgOutBgSelected"]],
  };
  for (const [target, entries] of Object.entries(pairs)) for (const [fgKey, bgKey] of entries) {
    const fg = rgba(target, fgKey), bg = rgba(target, bgKey);
    const result = evaluatePair({ fg: hexToColor(rgbHex(fg), fg[3] / 255), bg: hexToColor(rgbHex(bg), bg[3] / 255), min: 4.5 });
    assert.ok(result.pass, `${target}:${fgKey} on ${bgKey}: ${result.ratio}`);
  }
  for (const key of registry.android.keys.filter(key => /^windowBackgroundWhite(?:GrayText\d*|BlueText\d*|GreenText\d*|ValueText)$/.test(key))) {
    const fg = rgba("android", key), bg = rgba("android", "windowBackgroundGray");
    const result = evaluatePair({ fg: hexToColor(rgbHex(fg)), bg: hexToColor(rgbHex(bg)), min: 4.5 });
    assert.ok(result.pass, `${key} on settings panel: ${result.ratio}`);
  }
});

test("roles mapped on both targets project the same resolved role bytes", () => {
  let shared = 0;
  for (const [role, native] of Object.entries(mapping.mappings)) {
    const a = native.filter(key => key.startsWith("android:")), d = native.filter(key => key.startsWith("desktop:"));
    if (!a.length || !d.length) continue;
    shared++;
    for (const left of a) for (const right of d) assert.deepEqual(android.get(left.slice(8)), desktop.get(right.slice(8)), role);
  }
  assert.ok(shared > 10);
});

const block = (text, name) => text.split(`<!-- ${name}:start -->\n`)[1].split(`\n<!-- ${name}:end -->`)[0];
const downloads = Object.values(ARTIFACTS).map(file => manifest.site.url + "ports/telegram/" + file.path.split("/").at(-1));
const links = (text, pattern) => [...text.matchAll(pattern)].map(m => m[0]);
const T_ME = /https:\/\/t\.me\/addtheme\/[A-Za-z0-9_]+/g, EDITOR = /https:\/\/themes\.contest\.com\/theme\/[A-Za-z0-9_]+\?format=[a-z]+/g;

test("cloud.json records the owner's Theme Editor theme, unverified, with no slug the clients reject", async () => {
  const cloud = await readCloudConfig();
  assert.equal(cloud.slug, "TRhfHcbvZHlOucyc", "the theme the owner created in Telegram's Theme Editor");
  assert.equal(cloud.verified, false, "no live acceptance is recorded yet");
  assert.deepEqual(cloud.slugCandidates, ["j3w1_theme"], "the 4-character j3w1 is not a candidate");
  // Pinned client rules: 5–64 of [A-Za-z0-9_], a leading letter, no trailing _.
  for (const slug of ["j3w1", "abcd", "1abcde", "_abcde", "abcde_", "j3w1-theme", "a".repeat(65)]) assert.equal(validSlug(slug), false, slug);
  for (const slug of ["j3w1_theme", "TRhfHcbvZHlOucyc", "abcde", "a".repeat(64)]) assert.equal(validSlug(slug), true, slug);
  assert.throws(() => assertCloudConfig({ ...cloud, slugCandidates: ["j3w1", "j3w1_theme"] }), /slugCandidates/);
  assert.throws(() => assertCloudConfig({ ...cloud, slug: null, verified: true }), /verified needs a slug/);
  assert.throws(() => assertCloudConfig({ ...cloud, published: true }), /expected exactly/);
  assert.throws(() => assertCloudConfig({ ...cloud, schemaVersion: 1 }), /schemaVersion must be 2/);
  assert.equal(editorUrl(cloud.slug, "android"), "https://themes.contest.com/theme/TRhfHcbvZHlOucyc?format=android");
  assert.equal(editorUrl(cloud.slug, "desktop"), "https://themes.contest.com/theme/TRhfHcbvZHlOucyc?format=tdesktop");
  assert.equal(installLink(cloud.slug), "https://t.me/addtheme/TRhfHcbvZHlOucyc");
  // A verified link is owner-observed on both clients and recorded as evidence.
  if (cloud.verified) for (const os of [/android/i, /windows/i]) assert.ok(port.evidence.some(entry => os.test(entry.os)), `verified needs ${os} evidence`);
});

test("the guide and the publishing card are generated from cloud.json for every cloud state", async () => {
  const cloud = await readCloudConfig();
  assert.equal(block(await readText("ports/telegram/README.md"), "install"), telegramReadmeBlock(manifest, cloud));
  assert.equal(block(await readText("ports/telegram/PUBLISHING.md"), "cloud"), telegramPublishingBlock(manifest, cloud));
  const slug = "TRhfHcbvZHlOucyc";
  const none = telegramReadmeBlock(manifest, { ...cloud, slug: null, verified: false });
  const awaiting = telegramReadmeBlock(manifest, { ...cloud, slug, verified: false });
  const verified = telegramReadmeBlock(manifest, { ...cloud, slug, verified: true });
  for (const guide of [none, awaiting, verified]) {
    for (const url of downloads) assert.ok(guide.includes(url), url);
    for (const instruction of ["## Install from files", "Saved Messages", "Tap **Apply**.", "**Apply this theme**", "**Keep changes**"]) assert.ok(guide.includes(instruction), instruction);
  }
  // Files lead until the owner has verified the link; no unverified t.me link.
  assert.match(none, /^\*\*Cloud installation: not published yet\.\*\*/);
  assert.match(awaiting, /^\*\*Cloud installation: awaiting owner verification\.\*\*/);
  for (const guide of [none, awaiting]) assert.deepEqual(links(guide, T_ME), []);
  assert.deepEqual(links(none, EDITOR), []);
  assert.deepEqual(links(awaiting, EDITOR), [editorUrl(slug, "android")]);
  for (const step of ["**Android** tab: **Import file**, choose `j3w1.attheme`", "**TDesktop** tab: **Import file**, choose `j3w1.tdesktop-theme`", "No Telegram API application is needed."]) assert.ok(awaiting.includes(step), step);
  // Verified: the cloud link leads, once per client, and the same link.
  assert.match(verified, /^## Recommended: cloud theme\n/);
  assert.ok(verified.indexOf("## Recommended: cloud theme") < verified.indexOf("## Install from files"));
  assert.deepEqual(links(verified, T_ME), [installLink(slug), installLink(slug)]);
  assert.match(verified, /### Android\n\n1\. Open \[Install j3w1\]\(https:\/\/t\.me\/addtheme\/TRhfHcbvZHlOucyc\) on your phone\.\n2\. Tap \*\*Apply\*\*\.\n\n### Desktop\n\n1\. Open \[Install j3w1\]\(https:\/\/t\.me\/addtheme\/TRhfHcbvZHlOucyc\) on a computer with Telegram Desktop\.\n2\. Click \*\*Apply this theme\*\*, then \*\*Keep changes\*\* if Telegram asks\./);
  assert.ok(verified.includes("**Apply Theme**") && verified.includes("no Telegram Premium subscription is required."));
  assert.doesNotMatch(verified, /awaiting owner verification|not published yet/);
  // The publishing card names the same identity, editor tabs and files.
  const card = telegramPublishingBlock(manifest, { ...cloud, slug, verified: false });
  assert.deepEqual(links(card, EDITOR), [editorUrl(slug, "android"), editorUrl(slug, "desktop")]);
  assert.deepEqual(links(card, T_ME), [installLink(slug)]);
  assert.ok(card.includes("awaiting owner verification") && downloads.every(url => card.includes(url)));
  assert.ok(telegramPublishingBlock(manifest, { ...cloud, slug, verified: true }).includes("verified by the owner"));
  assert.deepEqual(links(telegramPublishingBlock(manifest, { ...cloud, slug: null, verified: false }), T_ME), []);
  // Only the generated blocks follow the cloud state; the install text copied
  // into the downloads table, the Ports page and the exports stays true in all.
  for (const file of port.files) assert.doesNotMatch(file.install, /not published|pending|published yet|no cloud theme|verified/i, file.path);
});

test("generation, validation and the Theme Editor route never need Telegram credentials", async () => {
  // Only the publisher and the opt-in CI job read credentials or load the client.
  const credential = /TELEGRAM_(?:API_ID|API_HASH|SESSION)|teleproto|my\.telegram\.org/;
  const allowed = new Set(["ports/telegram/publish.mjs", ".github/workflows/ci.yml", "ports/telegram/PUBLISHING.md", "ports/telegram/IMPLEMENTATION.md", "package.json", "package-lock.json", ".github/dependabot.yml", "scripts/lib/private-material.mjs", "CHANGELOG.md"]);
  const tracked = execFileSync("git", ["ls-files", "scripts", "ports/telegram", "schemas", "package.json", "package-lock.json", ".github", "CHANGELOG.md"], { encoding: "utf8" }).split("\n").filter(Boolean);
  const readers = [];
  for (const file of tracked) if (!/\.(?:attheme|tdesktop-theme|png)$/.test(file) && credential.test(await readText(file))) readers.push(file);
  assert.deepEqual(readers.filter(file => !allowed.has(file)), []);
  assert.ok(readers.includes("ports/telegram/publish.mjs"));
  // The generated guide needs no environment at all.
  const saved = { ...process.env };
  try {
    for (const key of Object.keys(process.env)) if (key.startsWith("TELEGRAM_")) delete process.env[key];
    assert.equal(telegramReadmeBlock(manifest, await readCloudConfig()), block(await readText("ports/telegram/README.md"), "install"));
  } finally { Object.assign(process.env, saved); }
});
