/* Parsing of spec/*.md and spec/components/<id>.md: YAML frontmatter, body
   sections, token references, demo fragments, decision table. */

import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { exists, listFiles, readJson, readText } from "./fs.mjs";
import { BODY_SECTIONS, componentSchema } from "../../schemas/component.mjs";
import { docSchema, familySchema } from "../../schemas/doc.mjs";

export class SpecError extends Error {}

export const splitFrontmatter = (source, file) => {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new SpecError(`${file}: missing YAML frontmatter`);
  let data;
  try {
    data = parseYaml(match[1]);
  } catch (error) {
    throw new SpecError(`${file}: frontmatter is not valid YAML: ${error.message}`);
  }
  return { data, body: match[2] };
};

const formatIssues = (issues) => issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");

export const loadFamilies = async () => {
  const raw = await readJson("spec/families.json");
  const parsed = familySchema(z).safeParse(raw);
  if (!parsed.success) throw new SpecError(`spec/families.json:\n${formatIssues(parsed.error.issues)}`);
  return parsed.data.sort((a, b) => a.order - b.order);
};

export const loadDoc = async (file) => {
  const { data, body } = splitFrontmatter(await readText(file), file);
  const parsed = docSchema(z).safeParse(data);
  if (!parsed.success) throw new SpecError(`${file}:\n${formatIssues(parsed.error.issues)}`);
  return { file, ...parsed.data, body };
};

export const listDocs = async () => (await listFiles("spec", { filter: (f) => /^spec\/[a-z-]+\.md$/.test(f) }));

/* Body sections keyed by their `## Heading`. */
export const sections = (body) => {
  const out = new Map();
  let current = null;
  for (const line of body.split("\n")) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = heading[1].trim();
      out.set(current, []);
    } else if (current) out.get(current).push(line);
  }
  return new Map([...out].map(([k, v]) => [k, v.join("\n").trim()]));
};

export const listComponentFiles = async () => listFiles("spec/components", { filter: (f) => f.endsWith(".md") });

export const componentIdOf = (file) => file.replace(/^spec\/components\//, "").replace(/\.md$/, "");

export const loadComponent = async (file, { families } = {}) => {
  const { data, body } = splitFrontmatter(await readText(file), file);
  const parsed = componentSchema(z, { families }).safeParse(data);
  if (!parsed.success) throw new SpecError(`${file}:\n${formatIssues(parsed.error.issues)}`);
  const component = parsed.data;
  if (component.id !== componentIdOf(file)) throw new SpecError(`${file}: id "${component.id}" must equal the file name`);
  const bodySections = sections(body);
  const missing = BODY_SECTIONS.filter((s) => !bodySections.has(s));
  if (missing.length) throw new SpecError(`${file}: missing body sections: ${missing.join(", ")}`);
  const order = [...bodySections.keys()].filter((k) => BODY_SECTIONS.includes(k));
  if (order.join("|") !== BODY_SECTIONS.join("|")) throw new SpecError(`${file}: body sections must be in the order ${BODY_SECTIONS.join(", ")}`);
  const demoFile = `spec/components/${component.id}.demo.html`;
  const demo = (await exists(demoFile)) ? await readText(demoFile) : null;
  return { file, ...component, body, sections: bodySections, demoFile, demo };
};

export const loadComponents = async () => {
  const families = (await loadFamilies()).map((f) => f.id);
  const files = await listComponentFiles();
  const components = [];
  for (const file of files) components.push(await loadComponent(file, { families }));
  return components;
};

/* Every {token.path} mentioned in prose, plus the frontmatter maps. */
export const tokenRefsOf = (component) => {
  const refs = new Set(Object.values(component.tokens));
  for (const roles of Object.values(component.stateTokens)) for (const v of Object.values(roles)) refs.add(v);
  for (const pair of component.contrast) {
    refs.add(pair.fg);
    refs.add(pair.bg);
  }
  for (const match of component.body.matchAll(/\{([a-z0-9][a-z0-9.-]*)\}/g)) refs.add(match[1]);
  return [...refs];
};

/* Demo fragments: `<!-- @variant id -->` markers split the fragment; the
   text before the first marker belongs to the `default` variant. */
export const splitVariants = (fragment) => {
  const out = new Map();
  let current = "default";
  let buffer = [];
  for (const line of fragment.split("\n")) {
    const marker = line.match(/^\s*<!--\s*@variant\s+([a-z][a-z0-9-]*)\s*-->\s*$/);
    if (marker) {
      if (buffer.join("").trim()) out.set(current, buffer.join("\n").trim());
      current = marker[1];
      buffer = [];
    } else buffer.push(line);
  }
  if (buffer.join("").trim()) out.set(current, buffer.join("\n").trim());
  return out;
};

/* Decision table from spec/decisions.md: D-nnn → { title, status, date }. */
export const loadDecisions = async () => {
  const source = await readText("spec/decisions.md");
  const decisions = new Map();
  for (const line of source.split("\n")) {
    const row = line.match(/^\| (D-\d{3}) \| (.+?) \| (proposed|accepted|rejected|superseded) \| (\S+) \| (.+?) \|$/);
    if (row) decisions.set(row[1], { title: row[2], status: row[3], date: row[4], by: row[5] });
  }
  for (const id of decisions.keys()) {
    if (!source.includes(`\n## ${id} `)) throw new SpecError(`spec/decisions.md: ${id} is in the table but has no section`);
  }
  return decisions;
};
