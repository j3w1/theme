import { LineCounter, parseDocument } from "yaml";
import { readText } from "./fs.mjs";

// YAML also parses JSON. Resolve source positions from parsed nodes, rather
// than searching repeated role values or guessing frontmatter line numbers.
export const attachSourceLines = async (index) => {
  const files = new Map();
  const locate = async (source) => {
    if (!files.has(source.file)) {
      const text = await readText(source.file);
      const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
      const counter = new LineCounter();
      const doc = parseDocument(frontmatter ? frontmatter[1] : text, { lineCounter: counter });
      if (doc.errors.length) throw new Error(`Cannot index source locations in ${source.file}`);
      files.set(source.file, { doc, counter, offset: frontmatter ? 1 : 0, bodyLine: frontmatter ? frontmatter[0].split("\n").length : null });
    }
    const { doc, counter, offset, bodyLine } = files.get(source.file);
    if (source.pointer === "body") { source.line = bodyLine; return; }
    const parts = source.pointer.slice(1).split("/").map((p) => p.replaceAll("~1", "/").replaceAll("~0", "~"));
    const node = doc.getIn(parts, true);
    if (!node?.range) throw new Error(`Missing indexed source ${source.file}${source.pointer}`);
    source.line = counter.linePos(node.range[0]).line + offset;
  };
  for (const profile of Object.values(index.profiles)) for (const token of Object.values(profile.tokens)) {
    await locate(token.source);
    for (const use of token.uses) await locate(use.source);
    for (const pair of token.contrast) await locate(pair.source);
    for (const port of token.unmappedPorts) await locate(port.source);
  }
  return index;
};
