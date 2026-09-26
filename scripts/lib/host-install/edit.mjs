/* Minimal, byte-preserving edits of one key in the hosts' own settings files.
   Nothing here re-serialises a whole file: the key's text span is replaced,
   inserted or removed and every other byte stays where it was. Every edit is
   then checked with a real parse: the result must hold exactly the old
   document with that one key changed. */

import { promises as fs } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

export class EditError extends Error {}

/* ---- text --------------------------------------------------------------- */

const BOM = "﻿";

/* A byte-order mark is kept aside and written back unchanged. */
export const decodeText = (bytes) => {
  const text = bytes ? Buffer.from(bytes).toString("utf8") : "";
  return text.startsWith(BOM) ? { bom: true, text: text.slice(1) } : { bom: false, text };
};

export const encodeText = (bom, text) => Buffer.from(`${bom ? BOM : ""}${text}`);

const eolOf = (text) => (text.includes("\r\n") ? "\r\n" : "\n");

/* ---- JSON: one top-level member of the root object ---------------------- */

const skipWs = (s, i) => {
  while (i < s.length && " \t\r\n".includes(s[i])) i += 1;
  return i;
};

const scanString = (s, i) => {
  if (s[i] !== '"') throw new EditError(`expected a string at offset ${i}`);
  for (let j = i + 1; j < s.length; j += 1) {
    if (s[j] === "\\") j += 1;
    else if (s[j] === '"') return j + 1;
  }
  throw new EditError("unterminated string");
};

const scanValue = (s, i) => {
  const c = s[i];
  if (c === '"') return scanString(s, i);
  if (c === "{" || c === "[") {
    const close = c === "{" ? "}" : "]";
    let j = skipWs(s, i + 1);
    if (s[j] === close) return j + 1;
    for (;;) {
      if (c === "{") {
        j = skipWs(s, scanString(s, j));
        if (s[j] !== ":") throw new EditError(`expected ':' at offset ${j}`);
        j = skipWs(s, j + 1);
      }
      j = skipWs(s, scanValue(s, j));
      if (s[j] === ",") j = skipWs(s, j + 1);
      else if (s[j] === close) return j + 1;
      else throw new EditError(`unexpected '${s[j] ?? "end"}' at offset ${j}`);
    }
  }
  const m = /^(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(s.slice(i, i + 64));
  if (!m) throw new EditError(`unexpected '${c ?? "end"}' at offset ${i}`);
  return i + m[0].length;
};

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new EditError(`not valid JSON (${error.message})`);
  }
};

/* Offsets of the root object's members. */
export const jsonMembers = (text) => {
  let i = skipWs(text, 0);
  if (text[i] !== "{") throw new EditError("the settings file is not a JSON object");
  const open = i;
  const members = [];
  i = skipWs(text, i + 1);
  if (text[i] !== "}") {
    for (;;) {
      const keyStart = i;
      const keyEnd = scanString(text, i);
      i = skipWs(text, keyEnd);
      if (text[i] !== ":") throw new EditError(`expected ':' at offset ${i}`);
      const valueStart = skipWs(text, i + 1);
      const valueEnd = scanValue(text, valueStart);
      members.push({ key: parseJson(text.slice(keyStart, keyEnd)), keyStart, valueStart, valueEnd });
      i = skipWs(text, valueEnd);
      if (text[i] === ",") i = skipWs(text, i + 1);
      else if (text[i] === "}") break;
      else throw new EditError(`unexpected '${text[i] ?? "end"}' at offset ${i}`);
    }
  }
  if (skipWs(text, i + 1) !== text.length) throw new EditError("trailing content after the JSON object");
  return { open, close: i, members };
};

const lineIndent = (text, offset) => {
  const start = text.lastIndexOf("\n", offset - 1) + 1;
  return /^[ \t]*/.exec(text.slice(start))[0];
};

export const jsonGet = (text, key) => {
  const found = jsonMembers(text).members.filter((x) => x.key === key);
  if (found.length > 1) throw new EditError(`"${key}" appears more than once`);
  const [m] = found;
  return m ? { present: true, value: parseJson(text.slice(m.valueStart, m.valueEnd)), raw: text.slice(m.valueStart, m.valueEnd) } : { present: false };
};

/* Sets one top-level key; an absent key is appended after the last member
   with that member's indentation and the file's line ending. */
export const jsonSet = (text, key, value) => jsonSetRaw(text, key, JSON.stringify(value));

export const jsonSetRaw = (text, key, encoded) => {
  const eol = eolOf(text);
  if (text.trim() === "") return `{${eol}  ${JSON.stringify(key)}: ${encoded}${eol}}${eol}`;
  const { open, close, members } = jsonMembers(text);
  const found = members.filter((x) => x.key === key);
  if (found.length > 1) throw new EditError(`"${key}" appears more than once`);
  if (found.length) {
    const m = found[0];
    return text.slice(0, m.valueStart) + encoded + text.slice(m.valueEnd);
  }
  if (members.length) {
    const last = members.at(-1);
    return `${text.slice(0, last.valueEnd)},${eol}${lineIndent(text, last.keyStart)}${JSON.stringify(key)}: ${encoded}${text.slice(last.valueEnd)}`;
  }
  return `${text.slice(0, open + 1)}${eol}  ${JSON.stringify(key)}: ${encoded}${eol}${text.slice(close)}`;
};

/* Removes one top-level key, the exact inverse of jsonSet's append. */
export const jsonRemove = (text, key) => {
  const { members } = jsonMembers(text);
  const index = members.findIndex((x) => x.key === key);
  if (index < 0) return text;
  const m = members[index];
  if (index < members.length - 1) return text.slice(0, m.keyStart) + text.slice(members[index + 1].keyStart);
  if (index > 0) return text.slice(0, members[index - 1].valueEnd) + text.slice(m.valueEnd);
  const { open, close } = jsonMembers(text);
  return `${text.slice(0, open + 1)}${text.slice(close)}`;
};

/* The edited text must parse to the original document with only `key`
   changed ({ value } set, or { absent: true } removed). */
export const jsonVerify = (before, after, key, want, where) => {
  const a = before.trim() === "" ? {} : parseJson(before);
  let b;
  try {
    b = parseJson(after);
  } catch (error) {
    throw new EditError(`the edited ${where} would not be valid JSON (${error.message})`);
  }
  const expected = { ...a };
  if (want.absent) delete expected[key];
  else expected[key] = want.value;
  if (!isDeepStrictEqual(b, expected)) throw new EditError(`editing "${key}" in ${where} would change more than that key; edit it by hand`);
};

/* ---- TOML: one key of one table, line based ----------------------------- */

/* Lines are split on \n and matched without their trailing \r, which is
   written back unchanged; inserted lines take the file's line ending. */
const BARE = "[A-Za-z0-9_-]+";
const BASIC = '"(?:[^"\\\\\\n]|\\\\.)*"';
const LITERAL = "'[^'\\n]*'";
const KEY_PART = `(?:${BARE}|${BASIC}|${LITERAL})`;
const KEY_PATH = `${KEY_PART}(?:\\s*\\.\\s*${KEY_PART})*`;
const HEADER = new RegExp(`^\\s*(\\[\\[?)\\s*(${KEY_PATH})\\s*\\]\\]?\\s*(?:#.*)?$`);
const KEY_LINE = new RegExp(`^\\s*(${KEY_PATH})\\s*=`);
const PLAIN_VALUE = (key) => new RegExp(`^(\\s*${key}\\s*=\\s*)("(?:[^"\\\\]|\\\\.)*"|'[^']*')(\\s*(?:#.*)?)$`);

const ESCAPES = { b: "\b", t: "\t", n: "\n", f: "\f", r: "\r", e: "\u001b", '"': '"', "\\": "\\" };

/* A TOML basic string's escapes; anything else is refused, never guessed. */
export const tomlUnescape = (s) =>
  s.replace(/\\(?:u([0-9A-Fa-f]{4})|U([0-9A-Fa-f]{8})|x([0-9A-Fa-f]{2})|([\s\S]))/g, (m, u4, u8, x2, c) => {
    const hex = u4 ?? u8 ?? x2;
    if (hex !== undefined) {
      const cp = Number.parseInt(hex, 16);
      if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) throw new EditError(`the escape ${m} is not a Unicode scalar value`);
      return String.fromCodePoint(cp);
    }
    if (Object.hasOwn(ESCAPES, c)) return ESCAPES[c];
    throw new EditError(`the escape ${m} is not one this editor reads`);
  });

const keyParts = (raw) =>
  [...raw.matchAll(new RegExp(KEY_PART, "g"))].map(([p]) => ({
    quoted: p[0] === '"' || p[0] === "'",
    name: p[0] === '"' ? tomlUnescape(p.slice(1, -1)) : p[0] === "'" ? p.slice(1, -1) : p,
  }));

const body = (line) => (line.endsWith("\r") ? line.slice(0, -1) : line);
const cr = (line) => (line.endsWith("\r") ? "\r" : "");

/* Finds [table] and its `key` line, and refuses every other form that
   names the table or the key: a quoted or array header, dotted or inline
   keys at the top level, a second header, a quoted, dotted or multi-line
   key. Those are valid TOML the line editor would get wrong. */
const tomlScan = (text, table, key) => {
  const lines = text.split("\n");
  const refuse = (i, why) => {
    throw new EditError(`line ${i + 1} "${body(lines[i]).trim()}" ${why}; the kit only edits a plain [${table}] table with a plain ${key} = "..." line. Edit ${table}.${key} by hand`);
  };
  let range = null;
  let inRoot = true;
  let keyIndex = -1;
  let match = null;
  for (let i = 0; i < lines.length; i += 1) {
    const b = body(lines[i]);
    const header = HEADER.exec(b);
    if (header) {
      inRoot = false;
      if (range && range.end === undefined) range.end = i;
      const parts = keyParts(header[2]);
      if (parts[0].name !== table) continue;
      if (header[1] === "[[" || parts[0].quoted) refuse(i, `names the ${table} table as an array or a quoted key`);
      if (parts.length === 1) {
        if (range) refuse(i, `repeats the [${table}] header`);
        range = { start: i };
      }
      continue;
    }
    const keyLine = KEY_LINE.exec(b);
    if (!keyLine) continue;
    const parts = keyParts(keyLine[1]);
    if (inRoot && parts[0].name === table) refuse(i, `defines ${table} with dotted or inline keys at the top level`);
    if (range && range.end === undefined && parts[0].name === key) {
      const plain = PLAIN_VALUE(key).exec(b);
      if (parts.length > 1 || parts[0].quoted || !plain || /^("""|''')/.test(plain[2])) refuse(i, `sets ${table}.${key} in a form other than a plain one-line string`);
      if (keyIndex >= 0) refuse(i, `repeats ${table}.${key}`);
      keyIndex = i;
      match = plain;
    }
  }
  if (range && range.end === undefined) range.end = lines.length;
  return { lines, range, keyIndex, match };
};

const plainValue = (literal) => (literal.startsWith('"') ? tomlUnescape(literal.slice(1, -1)) : literal.slice(1, -1));

export const tomlHasTable = (text, table, key) => tomlScan(text, table, key).range !== null;

export const tomlGet = (text, table, key) => {
  const { lines, keyIndex, match } = tomlScan(text, table, key);
  if (keyIndex < 0) return { present: false };
  return { present: true, line: body(lines[keyIndex]), value: plainValue(match[2]) };
};

/* Sets table.key to a string. Replaces only the value on an existing line,
   inserts one line under an existing header, or appends a new table. */
export const tomlSet = (text, table, key, value) => {
  const { lines, range, keyIndex, match } = tomlScan(text, table, key);
  const encoded = JSON.stringify(value);
  if (keyIndex >= 0) {
    lines[keyIndex] = `${match[1]}${encoded}${match[3]}${cr(lines[keyIndex])}`;
    return lines.join("\n");
  }
  if (range) {
    lines.splice(range.start + 1, 0, `${key} = ${encoded}${cr(lines[range.start])}`);
    return lines.join("\n");
  }
  const eol = eolOf(text);
  const block = `[${table}]${eol}${key} = ${encoded}${eol}`;
  if (text === "") return block;
  return `${text}${text.endsWith("\n") ? "" : eol}${eol}${block}`;
};

/* Restores table.key: the previous line, or no line at all. A table this kit
   appended is removed again when nothing else was added to it. */
export const tomlRestore = (text, table, key, { beforeLine, appendedTable }) => {
  const { lines, range, keyIndex } = tomlScan(text, table, key);
  if (!range) {
    if (beforeLine === undefined) return text;
    const eol = eolOf(text);
    const block = `[${table}]${eol}${beforeLine}${eol}`;
    return text === "" ? block : `${text}${text.endsWith("\n") ? "" : eol}${eol}${block}`;
  }
  if (keyIndex < 0) {
    if (beforeLine === undefined) return text;
    lines.splice(range.start + 1, 0, `${beforeLine}${cr(lines[range.start])}`);
    return lines.join("\n");
  }
  if (beforeLine !== undefined) {
    lines[keyIndex] = `${beforeLine}${cr(lines[keyIndex])}`;
    return lines.join("\n");
  }
  lines.splice(keyIndex, 1);
  const end = range.end - 1;
  if (appendedTable && end === lines.length && lines.slice(range.start + 1, end).every((l) => l.trim() === "")) {
    /* The kit appended "<eol>[table]<eol>key = value<eol>" at the end: the
       lines before the header already end with the blank separator, so
       joining them gives the original text plus the line ending added to an
       unterminated file. */
    let out = lines.slice(0, range.start).join("\n");
    if (out.endsWith("\r")) out = out.slice(0, -1);
    if (appendedTable.addedNewline) out = out.replace(/\r?\n$/, "");
    return out;
  }
  return lines.join("\n");
};

/* The TOML parser is smol-toml, which this checkout already installs. It is
   loaded only when a TOML file is read, so the rest of the kit keeps working
   without node_modules. */
let tomlParse;
export const tomlParser = async () => {
  if (!tomlParse) {
    let parse;
    try {
      ({ parse } = await import("smol-toml"));
    } catch (error) {
      throw new EditError(`checking config.toml needs the smol-toml package, which this checkout has not installed (${error.code ?? error.message}); run npm ci in the checkout and try again. Nothing was written`);
    }
    /* Every valid TOML integer is a signed 64-bit one; beyond 2^53 it is read
       as a BigInt rather than refused as invalid. */
    tomlParse = (text) => parse(text, { integersAsBigInt: "asNeeded" });
  }
  return tomlParse;
};

/* JSON.stringify for values a TOML parse may hold (a BigInt). */
const showParsed = (value) => (typeof value === "bigint" ? String(value) : JSON.stringify(value));

const firstLine = (message) => String(message).split("\n")[0];

export const tomlDocument = (parse, text, where) => {
  try {
    return parse(text);
  } catch (error) {
    throw new EditError(`${where} is not valid TOML (${firstLine(error.message)}); fix it first`);
  }
};

/* The document without table.key; a table left empty counts as absent. */
const withoutKey = (doc, table, key) => {
  const copy = { ...doc };
  const t = copy[table];
  if (t && typeof t === "object" && !Array.isArray(t) && !(t instanceof Date)) {
    const rest = { ...t };
    delete rest[key];
    if (Object.keys(rest).length) copy[table] = rest;
    else delete copy[table];
  }
  return copy;
};

/* table.key as the parser reads it, cross-checked with what the line editor
   sees, so a value it cannot see is never reported as absent. */
export const tomlRead = (parse, text, table, key, where) => {
  const doc = tomlDocument(parse, text, where);
  const current = tomlGet(text, table, key);
  const parsed = doc[table]?.[key];
  if (current.present ? parsed !== current.value : parsed !== undefined) {
    throw new EditError(`${where}: ${table}.${key} is ${showParsed(parsed)} in a form this editor does not change (dotted key, inline table or quoted name); edit it by hand`);
  }
  return current;
};

/* The edited text must parse to the original document with only table.key
   changed ({ value } set, or { absent: true } removed). */
export const tomlVerify = (parse, before, after, table, key, want, where) => {
  const a = tomlDocument(parse, before, where);
  let b;
  try {
    b = parse(after);
  } catch (error) {
    throw new EditError(`the edited ${where} would not be valid TOML (${firstLine(error.message)}); edit ${table}.${key} by hand`);
  }
  const got = b[table]?.[key];
  if (want.absent ? got !== undefined : got !== want.value) throw new EditError(`the edited ${where} would read ${table}.${key} as ${showParsed(got)}; edit it by hand`);
  if (!isDeepStrictEqual(withoutKey(a, table, key), withoutKey(b, table, key))) throw new EditError(`editing ${table}.${key} in ${where} would change more than that key; edit it by hand`);
};

/* ---- files -------------------------------------------------------------- */

export const readMaybe = async (file) => {
  try {
    return await fs.readFile(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

export const sameBytes = (a, b) => (a === null || b === null ? a === b : a.equals(b));

/* Another program wrote the file after the caller last compared it. */
export class ChangedError extends Error {}

/* The rename has happened, so the file holds the kit's write, but it did not
   read back as written: the caller counts the file as written. */
export class WrittenError extends EditError {}

/* `expect` (bytes, or null for absent) is compared with the file once more
   immediately before the rename or unlink, which narrows the window in which
   another program's write can be lost to that one system call. */
const unchanged = async (file, target, expect, beforeCommit) => {
  if (expect === undefined) return;
  await beforeCommit?.(file);
  if (!sameBytes(await readMaybe(target), expect)) throw new ChangedError(`${file} changed while the kit was writing it`);
};

/* Writes through a symlink to its target, via a temp file and rename in the
   target's directory, keeping the previous mode. */
export const atomicWrite = async (file, bytes, { mode = 0o644, expect, beforeCommit } = {}) => {
  let target = file;
  let keepMode = mode;
  try {
    target = await fs.realpath(file);
    keepMode = (await fs.stat(target)).mode & 0o777;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = path.join(path.dirname(target), `.${path.basename(target)}.j3w1-${process.pid}.tmp`);
  const handle = await fs.open(temp, "w", keepMode);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.chmod(temp, keepMode);
  try {
    await unchanged(file, target, expect, beforeCommit);
  } catch (error) {
    await fs.rm(temp, { force: true });
    throw error;
  }
  await fs.rename(temp, target);
  let back;
  try {
    back = await fs.readFile(target);
  } catch (error) {
    throw new WrittenError(`${file} was written but could not be read back (${error.code ?? error.message})`);
  }
  if (!back.equals(Buffer.from(bytes))) throw new WrittenError(`${file} did not read back as written`);
};

export const removeFile = async (file, { expect, beforeCommit } = {}) => {
  await unchanged(file, file, expect, beforeCommit);
  try {
    await fs.unlink(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};
