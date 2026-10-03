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

// Both official clients accept [A-Za-z0-9_] only and Desktop's link handler
// matches ^addtheme/([a-zA-Z0-9\.\_]+); a hyphen never works. The clients'
// 5-character minimum is not enforced here: the server decides (owner
// instruction: try "j3w1" first).
export const SLUG_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
export const validSlug = slug => typeof slug === "string" && SLUG_PATTERN.test(slug) && !slug.endsWith("_");

export const installLink = slug => {
  if (!validSlug(slug)) throw new Error(`telegram: invalid slug ${JSON.stringify(slug)}`);
  return `https://t.me/addtheme/${slug}`;
};

export const assertCloudConfig = value => {
  const keys = ["published", "schemaVersion", "slug", "slugCandidates", "title"];
  if (!value || typeof value !== "object" || Object.keys(value).sort().join() !== keys.join()) throw new Error(`ports/telegram/${CLOUD_CONFIG}: expected exactly ${keys.join(", ")}`);
  if (value.schemaVersion !== 1) throw new Error(`ports/telegram/${CLOUD_CONFIG}: schemaVersion must be 1`);
  if (typeof value.title !== "string" || !value.title || value.title.length > 128) throw new Error(`ports/telegram/${CLOUD_CONFIG}: title is required`);
  if (!Array.isArray(value.slugCandidates) || !value.slugCandidates.length || !value.slugCandidates.every(validSlug) || new Set(value.slugCandidates).size !== value.slugCandidates.length) throw new Error(`ports/telegram/${CLOUD_CONFIG}: slugCandidates must be distinct valid slugs`);
  if (value.slug !== null && !validSlug(value.slug)) throw new Error(`ports/telegram/${CLOUD_CONFIG}: slug must be null or a valid slug`);
  if (typeof value.published !== "boolean" || (value.published && value.slug === null)) throw new Error(`ports/telegram/${CLOUD_CONFIG}: published needs a slug`);
  return value;
};

export const readCloudConfig = async (dir = PORT_DIR) => assertCloudConfig(JSON.parse(await readFile(path.join(dir, CLOUD_CONFIG), "utf8")));
