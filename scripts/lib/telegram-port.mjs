// Deterministic native Telegram projections; no host defaults or derived colours.
import { crc32 } from "node:zlib";
import { z } from "zod";
import { zipSync, zlibSync, strToU8 } from "fflate";
import { readJson } from "./fs.mjs";
import { toCss } from "./tokens.mjs";
import { eligibilityOf } from "./eligibility.mjs";
import { assertPortMapping } from "../../schemas/usage.mjs";
import { ARTIFACTS, DESKTOP_ENTRIES, assertCloudConfig, installLink } from "../../ports/telegram/src/contract.mjs";
import { portDownloadPath } from "./port-presentation.mjs";
import { colorValueSchema } from "../../schemas/tokens.mjs";

const registry = await readJson("ports/telegram/src/keys.json");
const coverage = await readJson("ports/telegram/src/coverage.json");

// Parse the resolver's CSS, including its existing percentage-alpha roles.
export const telegramColor = css => {
  if (/^#[0-9a-f]{6}$/i.test(css ?? "")) return [...[1, 3, 5].map(i => parseInt(css.slice(i, i + 2), 16)), 255];
  const match = /^rgb\((\d+) (\d+) (\d+) \/ (\d+(?:\.\d+)?)%\)$/.exec(css ?? "");
  if (match) {
    const [, r, g, b, percent] = match.map(Number);
    if ([r, g, b].every(n => n >= 0 && n <= 255) && percent >= 0 && percent <= 100) return [r, g, b, Math.round(percent / 100 * 255)];
  }
  throw new Error(`Telegram: malformed or unsupported colour ${JSON.stringify(css)}`);
};
export const androidArgb = ([r, g, b, a]) => ((a << 24) | (r << 16) | (g << 8) | b).toString();
export const desktopHex = rgba => "#" + rgba.slice(0, rgba[3] === 255 ? 3 : 4).map(n => n.toString(16).padStart(2, "0")).join("");

const chunk = (name, data) => {
  const type = Buffer.from(name, "ascii"), size = Buffer.alloc(4), checksum = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([size, type, data, checksum]);
};
const wallpaperPng = (top, bottom) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(2, 4);
  ihdr[8] = 8; ihdr[9] = 2; // RGB, no alpha; remaining methods are zero.
  const rows = Uint8Array.from([0, ...top.slice(0, 3), 0, ...bottom.slice(0, 3)]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlibSync(rows, { level: 0 })), chunk("IEND", Buffer.alloc(0))]);
};

export const telegramArtifacts = ({ manifest, port, mapping, exported, resolved }) => {
  if (port.profile !== "default") throw new Error("Telegram requires the default profile");
  const profile = manifest.profiles.find(p => p.id === port.profile), values = new Map();
  for (const [role, keys] of Object.entries(mapping.mappings)) {
    const token = resolved.get(role);
    if (!token || role.startsWith("color.primitive.") || !["use", "use-and-report"].includes(eligibilityOf(profile, token, resolved).action) || !["use", "use-and-report"].includes(exported[role]?.eligibility?.action)) throw new Error(`Telegram requires an eligible semantic role: ${role}`);
    if (token.type !== "color") throw new Error(`Telegram ${role} requires color`);
    if (!colorValueSchema(z).safeParse(token.resolved).success) throw new Error(`Telegram malformed or unsupported colour value: ${role}`);
    const css = toCss(token.type, token.resolved), rgba = telegramColor(css);
    if (exported[role].css !== css) throw new Error(`Telegram resolved/exported colour disagreement: ${role}`);
    for (const native of keys) {
      const [target, key, extra] = native.split(":");
      if (extra !== undefined || !["android", "desktop"].includes(target) || !registry[target].keys.includes(key)) throw new Error(`Unknown Telegram native key: ${native}`);
      if (values.has(native)) throw new Error(`Duplicate Telegram native key: ${native}`);
      if (target === "android" && [...registry.android.nonColor, ...registry.android.animated].includes(key)) throw new Error(`Telegram nonColor/animated key cannot be emitted: ${native}`);
      // Overlays, selectors and ripples stay translucent so they never hide
      // content; only text keys reviewed in coverage.opaqueAllowed may take
      // an opaque text role (their translucent dark defaults are unreadable).
      if ([...registry[target].translucentDefault, ...coverage[target].translucent].includes(key) && rgba[3] === 255 && !coverage[target].opaqueAllowed?.[key]) throw new Error(`Telegram translucent overlay cannot be opaque: ${native}`);
      values.set(native, rgba);
    }
  }
  assertPortMapping({ ...port, mapping }, resolved.keys());
  const top = values.get("android:chat_wallpaper"), bottom = values.get("android:chat_wallpaper_gradient_to");
  if (!top || !bottom || top[3] !== 255 || bottom[3] !== 255) throw new Error("Telegram wallpaper requires two opaque mapped roles");
  const header = (mark, target) => `${mark} j3w1 theme ${manifest.version}, default profile, for Telegram ${target}.\n${mark} Generated from ports/telegram/mapping.json by npm run generate; do not edit.\n`;
  const android = header("#", "Android") + registry.android.keys.filter(key => values.has(`android:${key}`)).map(key => `${key}=${androidArgb(values.get(`android:${key}`))}`).join("\n") + "\n";
  const palette = header("//", "Desktop") + registry.desktop.keys.filter(key => values.has(`desktop:${key}`)).map(key => `${key}: ${desktopHex(values.get(`desktop:${key}`))};`).join("\n") + "\n";
  const bytes = zipSync({ [DESKTOP_ENTRIES.palette]: strToU8(palette), [DESKTOP_ENTRIES.background]: wallpaperPng(top, bottom) }, { level: 0, mtime: new Date(1980, 0, 1), os: 3, attrs: 0o644 << 16 });
  return [{ path: ARTIFACTS.android.path, text: android }, { path: ARTIFACTS.desktop.path, bytes }];
};

// Coverage table for IMPLEMENTATION.md, counted from the same data the tests
// check, so a mapping change can never leave the prose stale.
export const telegramCoverageBlock = mapping => {
  const mapped = new Set(Object.values(mapping.mappings).flat());
  const rows = ["| Target | Keys | Mapped | Inherited | Unset |", "| --- | ---: | ---: | ---: | ---: |"];
  for (const [target, label] of [["android", "Android"], ["desktop", "Desktop"]]) {
    const keys = registry[target].keys;
    const own = keys.filter(key => mapped.has(`${target}:${key}`)).length;
    const unset = keys.filter(key => !mapped.has(`${target}:${key}`) && coverage[target].unset[key]).length;
    rows.push(`| ${label} | ${keys.length} | ${own} | ${keys.length - own - unset} | ${unset} |`);
  }
  return rows.join("\n");
};

export const telegramReadmeBlock = (manifest, cloud) => {
  assertCloudConfig(cloud);
  // A published, readback-verified cloud theme is the primary route on both
  // clients; until then the generated files are the honest primary route.
  if (cloud.published) {
    const link = `[Install ${cloud.title}](${installLink(cloud.slug)})`;
    return [
      "## Android", "", `1. Open ${link}.`, "2. Tap **Apply** in Telegram.", "",
      "## Desktop", "", `1. Open ${link} with Telegram Desktop.`, "2. Click **Apply**.", "",
      "Updates arrive through Telegram while you use the cloud theme.",
      "No Telegram Premium subscription is required.",
    ].join("\n");
  }
  const download = target => manifest.site.url + portDownloadPath("telegram", ARTIFACTS[target].path);
  return [
    "## Android", "", `1. Download [j3w1.attheme](${download("android")}) and open it in Telegram (or send it to your Saved Messages and tap it there).`, "2. Tap **Apply**.", "",
    "## Desktop", "", `1. Download [j3w1.tdesktop-theme](${download("desktop")}) and open it with Telegram Desktop.`, "2. Click **Apply this theme**, then **Keep changes**.", "",
    "The one-tap cloud link, which also brings automatic updates, is pending publication.",
  ].join("\n");
};
