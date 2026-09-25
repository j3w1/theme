/* Minimal, byte-preserving edits of one key in the hosts' own settings files.
   Nothing here re-serialises a whole file: the key's text span is replaced,
   inserted or removed and every other byte stays where it was. */

import { promises as fs } from "node:fs";
import path from "node:path";

export class EditError extends Error {}

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
      members.push({ key: JSON.parse(text.slice(keyStart, keyEnd)), keyStart, valueStart, valueEnd });
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
  const m = jsonMembers(text).members.find((x) => x.key === key);
  return m ? { present: true, value: JSON.parse(text.slice(m.valueStart, m.valueEnd)) } : { present: false };
};

/* Sets one top-level key; an absent key is appended after the last member
   with that member's indentation. */
export const jsonSet = (text, key, value) => {
  if (text.trim() === "") return `{\n  ${JSON.stringify(key)}: ${JSON.stringify(value)}\n}\n`;
  const { open, close, members } = jsonMembers(text);
  const encoded = JSON.stringify(value);
  const found = members.filter((x) => x.key === key);
  if (found.length > 1) throw new EditError(`"${key}" appears more than once`);
  if (found.length) {
    const m = found[0];
    return text.slice(0, m.valueStart) + encoded + text.slice(m.valueEnd);
  }
  if (members.length) {
    const last = members.at(-1);
    return `${text.slice(0, last.valueEnd)},\n${lineIndent(text, last.keyStart)}${JSON.stringify(key)}: ${encoded}${text.slice(last.valueEnd)}`;
  }
  return `${text.slice(0, open + 1)}\n  ${JSON.stringify(key)}: ${encoded}\n${text.slice(close)}`;
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

/* ---- TOML: one key of one table, line based ----------------------------- */

const HEADER = /^\s*\[\[?\s*([^\]]*?)\s*\]\]?\s*(?:#.*)?$/;
const keyLine = (key) => new RegExp(`^(\\s*${key}\\s*=\\s*)("(?:[^"\\\\]|\\\\.)*"|'[^']*')(\\s*(?:#.*)?)$`);

const tomlLines = (text) => {
  const lines = text.split("\n");
  return { lines };
};

/* The [table] block: header index and the index after its last line. */
const tableRange = (lines, table) => {
  const start = lines.findIndex((l) => HEADER.exec(l)?.[1] === table && !l.trim().startsWith("[["));
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && !HEADER.test(lines[end])) end += 1;
  return { start, end };
};

const guardDotted = (lines, table, key) => {
  const firstHeader = lines.findIndex((l) => HEADER.test(l));
  const root = firstHeader < 0 ? lines : lines.slice(0, firstHeader);
  if (root.some((l) => new RegExp(`^\\s*${table}\\s*(\\.|=)`).test(l))) throw new EditError(`${table} is defined with dotted or inline keys at the top level; edit ${table}.${key} by hand`);
  const multiline = lines.find((l) => new RegExp(`^\\s*${key}\\s*=\\s*("""|''')`).test(l));
  if (multiline) throw new EditError(`${table}.${key} uses a multi-line string; edit it by hand`);
};

export const tomlGet = (text, table, key) => {
  const { lines } = tomlLines(text);
  const range = tableRange(lines, table);
  if (!range) return { present: false };
  for (let i = range.start + 1; i < range.end; i += 1) {
    const m = keyLine(key).exec(lines[i]);
    if (m) return { present: true, line: lines[i], value: m[2].startsWith('"') ? JSON.parse(m[2]) : m[2].slice(1, -1) };
    if (new RegExp(`^\\s*${key}\\s*=`).test(lines[i])) throw new EditError(`${table}.${key} is not a plain string: ${lines[i].trim()}`);
  }
  return { present: false };
};

/* Sets table.key to a string. Replaces only the value on an existing line,
   inserts one line under an existing header, or appends a new table. */
export const tomlSet = (text, table, key, value) => {
  const { lines } = tomlLines(text);
  guardDotted(lines, table, key);
  const encoded = JSON.stringify(value);
  const range = tableRange(lines, table);
  if (range) {
    for (let i = range.start + 1; i < range.end; i += 1) {
      const m = keyLine(key).exec(lines[i]);
      if (m) {
        lines[i] = `${m[1]}${encoded}${m[3]}`;
        return lines.join("\n");
      }
      if (new RegExp(`^\\s*${key}\\s*=`).test(lines[i])) throw new EditError(`${table}.${key} is not a plain string: ${lines[i].trim()}`);
    }
    lines.splice(range.start + 1, 0, `${key} = ${encoded}`);
    return lines.join("\n");
  }
  const block = `[${table}]\n${key} = ${encoded}\n`;
  if (text === "") return block;
  return `${text}${text.endsWith("\n") ? "" : "\n"}\n${block}`;
};

/* Restores table.key: the previous line, or no line at all. A table this kit
   appended is removed again when nothing else was added to it. */
export const tomlRestore = (text, table, key, { beforeLine, appendedTable }) => {
  const { lines } = tomlLines(text);
  const range = tableRange(lines, table);
  if (!range) return text;
  const index = lines.slice(range.start + 1, range.end).findIndex((l) => keyLine(key).test(l) || new RegExp(`^\\s*${key}\\s*=`).test(l));
  if (index < 0) {
    if (beforeLine === undefined) return text;
    lines.splice(range.start + 1, 0, beforeLine);
    return lines.join("\n");
  }
  const at = range.start + 1 + index;
  if (beforeLine !== undefined) {
    lines[at] = beforeLine;
    return lines.join("\n");
  }
  lines.splice(at, 1);
  const end = range.end - 1;
  if (appendedTable && end === lines.length && lines.slice(range.start + 1, end).every((l) => l.trim() === "")) {
    /* The kit appended "\n[table]\nkey = value\n" at the end: the lines
       before the header already end with the blank separator, so joining
       them gives the original text plus the newline added to an
       unterminated file. */
    const out = lines.slice(0, range.start).join("\n");
    return appendedTable.addedNewline && out.endsWith("\n") ? out.slice(0, -1) : out;
  }
  return lines.join("\n");
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

/* Writes through a symlink to its target, via a temp file and rename in the
   target's directory, keeping the previous mode. */
export const atomicWrite = async (file, bytes, { mode = 0o644 } = {}) => {
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
  await fs.rename(temp, target);
  const back = await fs.readFile(target);
  if (!back.equals(Buffer.from(bytes))) throw new EditError(`${file} did not read back as written`);
};

export const removeFile = async (file) => {
  try {
    await fs.unlink(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};
