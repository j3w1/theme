/* The only place the repository names what must never be published: vendor
   template identifiers, the private project the reference screenshots came
   from, font binaries, credentials. AGENTS.md points here instead of
   repeating the words. This file is excluded from its own scan. */

import { promises as fs } from "node:fs";
import path from "node:path";
import { repoRoot } from "./fs.mjs";

export const SELF = "scripts/lib/private-material.mjs";

/* Case-insensitive, word-boundary where the term is alphabetic. */
export const FORBIDDEN_TERMS = [
  "vuexy",
  "pixinvent",
  "themeselection",
  "@core/",
  "@layouts/",
  "casaelida",
];

export const CREDENTIAL_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\b(?:eyJ[A-Za-z0-9_-]{10,}\.){2}[A-Za-z0-9_-]{10,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

export const FONT_EXTENSIONS = [".ttf", ".otf", ".woff", ".woff2", ".eot"];

/* Magic numbers of font containers: wOF2, wOFF, OTTO, TrueType 0x00010000, 'true'. */
const FONT_MAGIC = [
  Buffer.from("wOF2"),
  Buffer.from("wOFF"),
  Buffer.from("OTTO"),
  Buffer.from([0x00, 0x01, 0x00, 0x00]),
  Buffer.from("true"),
];

export const BINARY_EXTENSIONS = [".png", ".webp", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip", ".gz", ".tar"];
export const IMAGE_EXTENSIONS = [".png", ".webp"];
export const IMAGE_DIRECTORIES = ["references/", "ports/"];
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

const termPattern = (term) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return /^[a-z]/i.test(term) && /[a-z]$/i.test(term) ? new RegExp(`\\b${escaped}\\b`, "i") : new RegExp(escaped, "i");
};

const isFontBuffer = (buffer) => FONT_MAGIC.some((magic) => buffer.subarray(0, magic.length).equals(magic));

/* Scans repo-relative files. Returns an array of { file, problem }. */
export const scanFiles = async (files, { textOnly = false } = {}) => {
  const findings = [];
  for (const file of files) {
    if (file === SELF) continue;
    const ext = path.extname(file).toLowerCase();
    const full = path.join(repoRoot, file);
    const buffer = await fs.readFile(full);
    if (buffer.length > MAX_FILE_BYTES) findings.push({ file, problem: `exceeds ${MAX_FILE_BYTES} bytes` });
    if (FONT_EXTENSIONS.includes(ext)) findings.push({ file, problem: "font binary by extension" });
    if (isFontBuffer(buffer)) findings.push({ file, problem: "font binary by magic bytes" });
    if (IMAGE_EXTENSIONS.includes(ext) && !IMAGE_DIRECTORIES.some((dir) => file.startsWith(dir))) {
      findings.push({ file, problem: "images belong under references/ or ports/*/evidence/" });
    }
    if (BINARY_EXTENSIONS.includes(ext)) continue;
    if (textOnly && buffer.includes(0)) continue;
    const text = buffer.toString("utf8");
    for (const term of FORBIDDEN_TERMS) {
      if (termPattern(term).test(text)) findings.push({ file, problem: `contains forbidden term (see ${SELF})` });
    }
    for (const pattern of CREDENTIAL_PATTERNS) {
      if (pattern.test(text)) findings.push({ file, problem: `matches credential pattern ${pattern}` });
    }
    if (/@font-face/i.test(text)) {
      for (const src of text.matchAll(/src\s*:\s*([^;}]+)/gi)) {
        const value = src[1];
        if (/url\(/i.test(value) && !/^\s*(?:local\([^)]*\)\s*,?\s*)+$/i.test(value)) {
          findings.push({ file, problem: "@font-face src may contain local() only" });
        }
      }
    }
    if (/data:(?:font|application\/(?:x-)?font|application\/octet-stream;base64,d09G)/i.test(text)) findings.push({ file, problem: "embedded font data URI" });
    if (/https?:\/\/j3w1\.github\.io\/(?!theme\/)/.test(text)) findings.push({ file, problem: "links to the user site outside /theme/ (no live imports from j3w1.github.io)" });
  }
  return findings;
};
