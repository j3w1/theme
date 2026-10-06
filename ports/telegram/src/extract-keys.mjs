#!/usr/bin/env node
// Maintainer-only: refresh keys.json from the pinned upstream sources.
//   node ports/telegram/src/extract-keys.mjs [--from <dir>]
// --from reads ThemeColors.java, Theme.java and colors.palette from a local
// directory instead of fetching them. Only key names, inheritance links and
// whether a key's upstream default is translucent are recorded; upstream
// colour values are never copied into this repository.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const UPSTREAM = {
  android: {
    repository: "DrKLO/Telegram",
    revision: "f2908b14133bbffbf7ab04f641ecb5bfaf533242",
    files: {
      colors: "TMessagesProj/src/main/java/org/telegram/ui/ActionBar/ThemeColors.java",
      theme: "TMessagesProj/src/main/java/org/telegram/ui/ActionBar/Theme.java",
    },
  },
  desktop: {
    repository: "desktop-app/lib_ui",
    revision: "b9242d3e711d2007e4872d19dd505c3580a63348",
    files: { palette: "ui/colors.palette" },
    client: { repository: "telegramdesktop/tdesktop", revision: "d8594c011756265de4385408540bd9f7c787a003" },
  },
};

// Keys the Android registry accepts that are not colours, and the keys that
// turn the wallpaper into an animated freeform gradient. Neither is ever
// emitted as a colour (Theme.java: wallpaperFileOffset, rotation and the
// animated-outgoing flag are integers; to2/to3 enable animation).
const ANDROID_NON_COLOR = ["wallpaperFileOffset", "chat_wallpaper_gradient_rotation", "chat_outBubbleGradientAnimated"];
const ANDROID_ANIMATED = ["key_chat_wallpaper_gradient_to2", "key_chat_wallpaper_gradient_to3"];

const raw = (repo, rev, file) => `https://raw.githubusercontent.com/${repo}/${rev}/${file}`;

const load = async (from, repo, rev, file) => {
  if (from) return readFile(path.join(from, path.basename(file)), "utf8");
  const response = await fetch(raw(repo, rev, file), { redirect: "error" });
  if (!response.ok) throw new Error(`${repo}@${rev}:${file}: HTTP ${response.status}`);
  return response.text();
};

export const parseAndroid = (colorsJava, themeJava) => {
  const names = new Map();
  for (const [, variable, name] of colorsJava.matchAll(/colorKeysMap\.put\((key_\w+),\s*"([^"]+)"\);/g)) {
    if (names.has(variable)) throw new Error(`android: ${variable} mapped twice`);
    names.set(variable, name);
  }
  const keys = [...names.values()];
  if (new Set(keys).size !== keys.length) throw new Error("android: duplicate string key");
  const fallbacks = {};
  // Upstream writes some fallbacks with a qualified target (Theme.key_…) and
  // varies the spacing; commented-out code is not a fallback.
  const live = themeJava.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  for (const [, from, to] of live.matchAll(/fallbackKeys\.put\(\s*(?:Theme\.)?(key_\w+)\s*,\s*(?:Theme\.)?(key_\w+)\s*\)\s*;/g)) {
    const a = names.get(from), b = names.get(to);
    // An id with no string name cannot be set by a theme file; it still
    // follows the theme's value for its fallback at runtime, so skip it here.
    if (!a) continue;
    if (!b) throw new Error(`android: fallback ${from} -> ${to} names an unregistered key`);
    fallbacks[a] = b;
  }
  const translucentDefault = [];
  for (const [, variable, hex] of colorsJava.matchAll(/defaultColors\[(key_\w+)\]\s*=\s*0x([0-9a-fA-F]{8});/g)) {
    const name = names.get(variable);
    if (name && parseInt(hex.slice(0, 2), 16) < 0xff) translucentDefault.push(name);
  }
  for (const key of [...ANDROID_NON_COLOR, ...ANDROID_ANIMATED]) if (!names.has(`key_${key.replace(/^key_/, "")}`) && !keys.includes(key)) throw new Error(`android: special key ${key} missing upstream`);
  const order = new Map(keys.map((key, index) => [key, index]));
  const sorted = list => [...new Set(list)].sort((a, b) => order.get(a) - order.get(b));
  return {
    keys,
    fallbacks: Object.fromEntries(Object.entries(fallbacks).sort(([a], [b]) => order.get(a) - order.get(b))),
    nonColor: sorted(ANDROID_NON_COLOR),
    animated: sorted(ANDROID_ANIMATED),
    translucentDefault: sorted(translucentDefault),
  };
};

export const parseDesktop = palette => {
  const text = palette.replace(/\/\*[\s\S]*?\*\//g, "");
  const keys = [], aliases = {}, fallbacks = {}, translucentDefault = [];
  for (const line of text.split("\n")) {
    const body = line.replace(/\/\/.*$/, "").trim();
    if (!body) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);$/.exec(body);
    if (!match) throw new Error(`desktop: unparsed palette line: ${body}`);
    const [, key, value] = match;
    if (keys.includes(key)) throw new Error(`desktop: ${key} declared twice`);
    keys.push(key);
    const [head, tail] = value.split("|").map(part => part.trim());
    if (/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(head)) {
      if (head.length === 9 && head.slice(7).toLowerCase() !== "ff") translucentDefault.push(key);
      if (tail !== undefined) fallbacks[key] = tail;
    } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(head) && tail === undefined) {
      aliases[key] = head;
    } else {
      throw new Error(`desktop: unsupported value for ${key}: ${value}`);
    }
  }
  for (const target of [...Object.values(aliases), ...Object.values(fallbacks)]) {
    if (!keys.includes(target)) throw new Error(`desktop: inheritance target ${target} is not a palette key`);
  }
  return { keys, aliases, fallbacks, translucentDefault };
};

export const extract = async ({ from } = {}) => {
  const a = UPSTREAM.android, d = UPSTREAM.desktop;
  const [colorsJava, themeJava, palette] = await Promise.all([
    load(from, a.repository, a.revision, a.files.colors),
    load(from, a.repository, a.revision, a.files.theme),
    load(from, d.repository, d.revision, d.files.palette),
  ]);
  return {
    schemaVersion: 1,
    upstream: UPSTREAM,
    android: parseAndroid(colorsJava, themeJava),
    desktop: parseDesktop(palette),
  };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--from");
  const keys = await extract({ from: at > 0 ? process.argv[at + 1] : undefined });
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "keys.json");
  await writeFile(out, `${JSON.stringify(keys, null, 2)}\n`);
  console.log(`keys.json: ${keys.android.keys.length} Android keys (${Object.keys(keys.android.fallbacks).length} fallbacks), ${keys.desktop.keys.length} Desktop keys (${Object.keys(keys.desktop.aliases).length} aliases, ${Object.keys(keys.desktop.fallbacks).length} fallbacks)`);
}
