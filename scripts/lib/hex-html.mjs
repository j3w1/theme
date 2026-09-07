import { parse, parseFragment, serialize } from "parse5";
import { hexMatches, swatchHtml } from "./hex-literals.mjs";

const excluded = new Set(["head", "script", "style", "textarea", "title", "template", "svg", "math", "select", "option"]);
const inline = new Set(["a", "abbr", "b", "bdi", "bdo", "cite", "code", "del", "em", "i", "ins", "kbd", "mark", "q", "s", "samp", "small", "span", "strong", "sub", "sup", "time", "u", "var"]);
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const textOf = (node) => node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(textOf).join("");
const skip = (node) => excluded.has(node.tagName) || attr(node, "hidden") !== undefined ||
  /(?:^|\s)hex-(?:literal|swatch)(?:\s|$)/.test(attr(node, "class") ?? "") ||
  (node.tagName === "a" && textOf(node).trim() === attr(node, "href"));

/* Read phrasing runs across syntax-highlight spans, never across block nodes.
   Insert from the end so original text-node offsets remain valid. */
export const decorateHexHtml = (html, index = {}, { fragment = false } = {}) => {
  const tree = fragment ? parseFragment(html) : parse(html);
  let run = [];
  const flush = () => {
    if (!run.length) return;
    let offset = 0;
    const entries = run.map((node) => {
      const entry = { node, start: offset, end: offset + node.value.length };
      offset = entry.end;
      return entry;
    });
    const text = run.map((n) => n.value).join("");
    for (const match of hexMatches(text).reverse()) {
      const end = match.index + match[0].length;
      const entry = entries.find((e) => e.start < end && e.end >= end);
      const localEnd = end - entry.start;
      const localStart = Math.max(0, match.index - entry.start);
      const node = entry.node;
      const before = node.value.slice(0, localStart);
      const literalEnd = node.value.slice(localStart, localEnd);
      const after = node.value.slice(localEnd);
      const wrapper = parseFragment(`<span class="hex-literal">${swatchHtml(match[0], index)}</span>`).childNodes[0];
      wrapper.childNodes.unshift({ nodeName: "#text", value: literalEnd, parentNode: wrapper });
      const parent = node.parentNode;
      wrapper.parentNode = parent;
      const nodes = [node, wrapper];
      node.value = before;
      if (after) nodes.push({ nodeName: "#text", value: after, parentNode: parent });
      parent.childNodes.splice(parent.childNodes.indexOf(node), 1, ...nodes);
    }
    run = [];
  };
  const walk = (node) => {
    if (skip(node)) { flush(); return; }
    if (node.nodeName === "#text") { run.push(node); return; }
    const boundary = node.tagName && !inline.has(node.tagName);
    if (boundary) flush();
    for (const child of [...(node.childNodes ?? [])]) walk(child);
    if (boundary) flush();
  };
  walk(tree);
  flush();
  return serialize(tree);
};
