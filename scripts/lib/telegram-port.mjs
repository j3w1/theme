// Deterministic native Telegram projections; no host defaults or derived colours.
import { crc32 } from "node:zlib";
import { z } from "zod";
import { zipSync, zlibSync, strToU8 } from "fflate";
import { readJson } from "./fs.mjs";
import { toCss } from "./tokens.mjs";
import { eligibilityOf } from "./eligibility.mjs";
import { assertPortMapping } from "../../schemas/usage.mjs";
import { ARTIFACTS, DESKTOP_ENTRIES, assertCloudConfig, editorUrl, installLink } from "../../ports/telegram/src/contract.mjs";
import { portDownloadPath } from "./port-presentation.mjs";
import { colorValueSchema } from "../../schemas/tokens.mjs";

const registry = await readJson("ports/telegram/src/keys.json");
const coverage = await readJson("ports/telegram/src/coverage.json");
// Keys Telegram's Theme Editor still writes but the pinned clients no longer
// read; mapping.json gives each a role (src/editor-keys.json has the source).
const editorKeys = await readJson("ports/telegram/src/editor-keys.json");
export const telegramKnownKey = (target, key) => registry[target].keys.includes(key) || editorKeys[target].includes(key);

// The value a client gives an unmapped key from the theme: Android reads one
// direct fallback; Desktop follows its alias or fallback chain.
export const telegramInherited = (values, target, key) => {
  for (let next = registry[target].aliases?.[key] ?? registry[target].fallbacks[key], depth = 0; next && depth < 12; depth++) {
    if (values.has(`${target}:${next}`)) return values.get(`${target}:${next}`);
    if (target === "android") return null;
    next = registry[target].aliases?.[next] ?? registry[target].fallbacks[next];
  }
  return null;
};

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
      if (extra !== undefined || !["android", "desktop"].includes(target) || !telegramKnownKey(target, key)) throw new Error(`Unknown Telegram native key: ${native}`);
      if (values.has(native)) throw new Error(`Duplicate Telegram native key: ${native}`);
      if (target === "android" && [...registry.android.nonColor, ...registry.android.animated].includes(key)) throw new Error(`Telegram nonColor/animated key cannot be emitted: ${native}`);
      // Overlays, selectors and ripples stay translucent so they never hide
      // content. Two reviewed exceptions: text keys in coverage.opaqueAllowed
      // take an opaque text role (their translucent dark defaults are
      // unreadable), and text-selection fills in coverage.opaqueUnderText take
      // the opaque selection fill, because every pinned draw path paints them
      // before the text.
      const reviewedOpaque = coverage[target].opaqueAllowed?.[key] || (coverage[target].opaqueUnderText?.[key] && role === "color.interaction.selection.bg");
      if ([...registry[target].translucentDefault, ...coverage[target].translucent].includes(key) && rgba[3] === 255 && !reviewedOpaque) throw new Error(`Telegram translucent overlay cannot be opaque: ${native}`);
      values.set(native, rgba);
    }
  }
  assertPortMapping({ ...port, mapping }, resolved.keys());
  const top = values.get("android:chat_wallpaper"), bottom = values.get("android:chat_wallpaper_gradient_to");
  if (!top || !bottom || top[3] !== 255 || bottom[3] !== 255) throw new Error("Telegram wallpaper requires two opaque mapped roles");
  const header = (mark, target) => `${mark} j3w1 theme ${manifest.version}, default profile, for Telegram ${target}.\n${mark} Generated from ports/telegram/mapping.json by npm run generate; do not edit.\n`;
  // Telegram's Theme Editor fills every key a file leaves out with Telegram's
  // stock default, which would break the clients' inheritance on the cloud
  // route. So an inherited key is written with the value it inherits, which is
  // exactly what a file import showed anyway; legacy editor keys follow last.
  const entries = target => [...registry[target].keys, ...editorKeys[target]].flatMap(key => {
    const own = values.get(`${target}:${key}`);
    if (own) return [[key, own]];
    if (target === "android" && [...registry.android.nonColor, ...registry.android.animated].includes(key)) return [];
    const inherited = registry[target].keys.includes(key) ? telegramInherited(values, target, key) : null;
    return inherited ? [[key, inherited]] : [];
  });
  const android = header("#", "Android") + entries("android").map(([key, rgba]) => `${key}=${androidArgb(rgba)}`).join("\n") + "\n";
  const palette = header("//", "Desktop") + entries("desktop").map(([key, rgba]) => `${key}: ${desktopHex(rgba)};`).join("\n") + "\n";
  const bytes = zipSync({ [DESKTOP_ENTRIES.palette]: strToU8(palette), [DESKTOP_ENTRIES.background]: wallpaperPng(top, bottom) }, { level: 0, mtime: new Date(1980, 0, 1), os: 3, attrs: 0o644 << 16 });
  return [{ path: ARTIFACTS.android.path, text: android }, { path: ARTIFACTS.desktop.path, bytes }];
};

// Coverage table for IMPLEMENTATION.md, counted from the same data the tests
// check, so a mapping change can never leave the prose stale.
export const telegramCoverageBlock = mapping => {
  const mapped = new Set(Object.values(mapping.mappings).flat());
  const rows = ["| Target | Keys | Mapped | Inherited | Unset | Legacy editor keys |", "| --- | ---: | ---: | ---: | ---: | ---: |"];
  for (const [target, label] of [["android", "Android"], ["desktop", "Desktop"]]) {
    const keys = registry[target].keys;
    const own = keys.filter(key => mapped.has(`${target}:${key}`)).length;
    const unset = keys.filter(key => !mapped.has(`${target}:${key}`) && coverage[target].unset[key]).length;
    rows.push(`| ${label} | ${keys.length} | ${own} | ${keys.length - own - unset} | ${unset} | ${editorKeys[target].filter(key => mapped.has(`${target}:${key}`)).length} |`);
  }
  return rows.join("\n");
};

const telegramDownload = (manifest, target) => manifest.site.url + portDownloadPath("telegram", ARTIFACTS[target].path);
const fileName = target => ARTIFACTS[target].path.split("/").at(-1);

// The guide leads with the cloud link only once the owner has verified it on
// both clients; until then the generated files are the honest primary route.
// Button labels are the clients' own strings at the pinned revisions
// (Android ApplyTheme "Apply"; Desktop lng_theme_preview_apply "Apply this
// theme", lng_theme_keep_changes "Keep changes"; t.me's "Apply Theme").
export const telegramReadmeBlock = (manifest, cloud) => {
  assertCloudConfig(cloud);
  const lines = [];
  if (cloud.verified) {
    const link = `[Install ${cloud.title}](${installLink(cloud.slug)})`;
    lines.push(
      "## Recommended: cloud theme", "",
      "One link for both clients. Telegram delivers theme updates automatically, and no Telegram Premium subscription is required.", "",
      "### Android", "", `1. Open ${link} on your phone.`, "2. Tap **Apply**.", "",
      "### Desktop", "", `1. Open ${link} on a computer with Telegram Desktop.`, "2. Click **Apply this theme**, then **Keep changes** if Telegram asks.", "",
      "If a web page opens instead, press **Apply Theme** on it, or send the link to your Saved Messages and tap it there.", "",
    );
  } else {
    lines.push(cloud.slug ? "**Cloud installation: awaiting owner verification.** Until then, install from the files below." : "**Cloud installation: not published yet.** Install from the files below.", "");
  }
  lines.push(
    "## Install from files", "",
    "### Android", "", `1. Download [${fileName("android")}](${telegramDownload(manifest, "android")}) and open it in Telegram (or send it to your Saved Messages and tap it there).`, "2. Tap **Apply**.", "",
    "### Desktop", "", `1. Download [${fileName("desktop")}](${telegramDownload(manifest, "desktop")}) and open it with Telegram Desktop.`, "2. Click **Apply this theme**, then **Keep changes**.", "",
    "A theme installed from a file never updates by itself.",
  );
  if (!cloud.slug) {
    lines.push("", "The owner publishes the cloud theme with Telegram's Theme Editor or `npm run telegram:publish`; see [Publishing](PUBLISHING.md).");
    return lines.join("\n");
  }
  lines.push(
    "", "## Update the cloud theme with Telegram's Theme Editor", "",
    "For the theme owner. No Telegram API application is needed.", "",
    "1. Download both files above.",
    `2. Open the [${cloud.title} Theme Editor](${editorUrl(cloud.slug, "android")}) and log in with your Telegram account.`,
    `3. **Android** tab: **IMPORT FILE**, choose \`${fileName("android")}\`, then **SAVE AND APPLY THEME**.`,
    `4. **TDesktop** tab: **IMPORT FILE**, choose \`${fileName("desktop")}\`, then **SAVE AND APPLY THEME**.`,
    cloud.verified
      ? "5. Open the install link on each device and apply it."
      : "5. Check the install link on Android and on Telegram Desktop, as [Publishing](PUBLISHING.md#check-the-install-link) describes.",
  );
  return lines.join("\n");
};

// The owner's reference card in PUBLISHING.md, generated from the same config.
export const telegramPublishingBlock = (manifest, cloud) => {
  assertCloudConfig(cloud);
  const files = `[${fileName("android")}](${telegramDownload(manifest, "android")}) · [${fileName("desktop")}](${telegramDownload(manifest, "desktop")})`;
  if (!cloud.slug) return [
    "| | |", "| --- | --- |",
    "| Cloud theme | not recorded yet: set `slug` in `cloud.json` after creating it |",
    `| Files | ${files} |`,
  ].join("\n");
  return [
    "| | |", "| --- | --- |",
    `| Cloud theme | ${cloud.title}, slug \`${cloud.slug}\` |`,
    `| Install link | ${installLink(cloud.slug)} (${cloud.verified ? "verified by the owner on Android and Telegram Desktop" : "awaiting owner verification"}) |`,
    `| Theme Editor | [Android](${editorUrl(cloud.slug, "android")}) · [TDesktop](${editorUrl(cloud.slug, "desktop")}) |`,
    `| Files | ${files} |`,
  ].join("\n");
};
