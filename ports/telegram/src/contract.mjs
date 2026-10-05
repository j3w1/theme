// The shared Telegram contract: artifact paths, the cloud-theme document
// formats and MIME types (core.telegram.org/method/account.uploadTheme:
// "application/x-tgtheme-{format}"), and the public distribution config.
// The emitter, the README generator and the publisher all import it.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PORT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Android sends format "android" and uploads theme.attheme (DrKLO/Telegram
// MessagesController); Desktop sends "tdesktop" and uploads
// <title>.tdesktop-theme (tdesktop window_theme_editor_box.cpp).
export const ARTIFACTS = Object.freeze({
  android: Object.freeze({ path: "dist/j3w1.attheme", format: "android", mime: "application/x-tgtheme-android", fileName: "theme.attheme" }),
  desktop: Object.freeze({ path: "dist/j3w1.tdesktop-theme", format: "tdesktop", mime: "application/x-tgtheme-tdesktop", fileName: "j3w1.tdesktop-theme" }),
});

// Inside the Desktop zip (tdesktop window_theme.cpp LoadTheme).
export const DESKTOP_ENTRIES = Object.freeze({ palette: "colors.tdesktop-theme", background: "background.png" });

export const CLOUD_CONFIG = "cloud.json";

// Both official clients accept 5 to 64 characters of [A-Za-z0-9_], starting
// with a letter and not ending with "_" (DrKLO/Telegram ThemeSetUrlActivity
// checkUrl; tdesktop window_theme_editor_box.cpp IsGoodSlug). Desktop's link
// handler matches ^addtheme/([a-zA-Z0-9\.\_]+), so a hyphen never works.
// Telegram's own random slugs are 16 such characters (kRandomSlugSize).
export const SLUG_PATTERN = /^[A-Za-z][A-Za-z0-9_]{3,62}[A-Za-z0-9]$/;
export const validSlug = slug => typeof slug === "string" && SLUG_PATTERN.test(slug);

export const installLink = slug => {
  if (!validSlug(slug)) throw new Error(`telegram: invalid slug ${JSON.stringify(slug)}`);
  return `https://t.me/addtheme/${slug}`;
};

// Telegram's Theme Editor edits the owner's cloud themes at /theme/<slug>,
// with one tab per format (?format=android, ?format=tdesktop) and a Telegram
// login instead of an API application (themes.contest.com, themes.js?6).
export const EDITOR_ORIGIN = "https://themes.contest.com";
export const editorUrl = (slug, target) => {
  if (!validSlug(slug) || !Object.hasOwn(ARTIFACTS, target)) throw new Error(`telegram: no editor page for ${JSON.stringify(slug)} ${JSON.stringify(target)}`);
  return `${EDITOR_ORIGIN}/theme/${slug}?format=${ARTIFACTS[target].format}`;
};

// slug is the cloud theme's identity, whoever created it (the Theme Editor or
// the publisher); slugCandidates only name a new theme while slug is null.
// verified is set by hand, and only after the owner has applied the theme
// from its install link on Android and on Telegram Desktop and recorded both
// in port.json evidence. A Theme Editor save or a publisher readback never
// sets it, and only a verified link leads the guide or takes CI updates.
export const assertCloudConfig = value => {
  const keys = ["schemaVersion", "slug", "slugCandidates", "title", "verified"];
  if (!value || typeof value !== "object" || Object.keys(value).sort().join() !== keys.join()) throw new Error(`ports/telegram/${CLOUD_CONFIG}: expected exactly ${keys.join(", ")}`);
  if (value.schemaVersion !== 2) throw new Error(`ports/telegram/${CLOUD_CONFIG}: schemaVersion must be 2`);
  if (typeof value.title !== "string" || !value.title || value.title.length > 128) throw new Error(`ports/telegram/${CLOUD_CONFIG}: title is required`);
  if (!Array.isArray(value.slugCandidates) || !value.slugCandidates.length || !value.slugCandidates.every(validSlug) || new Set(value.slugCandidates).size !== value.slugCandidates.length) throw new Error(`ports/telegram/${CLOUD_CONFIG}: slugCandidates must be distinct valid slugs (5–64 characters)`);
  if (value.slug !== null && !validSlug(value.slug)) throw new Error(`ports/telegram/${CLOUD_CONFIG}: slug must be null or a valid slug (5–64 characters)`);
  if (typeof value.verified !== "boolean" || (value.verified && value.slug === null)) throw new Error(`ports/telegram/${CLOUD_CONFIG}: verified needs a slug`);
  return value;
};

export const readCloudConfig = async (dir = PORT_DIR) => assertCloudConfig(JSON.parse(await readFile(path.join(dir, CLOUD_CONFIG), "utf8")));
