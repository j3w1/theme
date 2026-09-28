/* Bounded structural cascade model, not a browser or an Obsidian import.
   Supports the audited descendant/compound selectors, :not(), attributes,
   named states and logical border/padding declarations used by these contracts.
   Unknown syntax fails, rather than silently disappearing from the model. */
import assert from "node:assert/strict";
import postcss from "postcss";

export const element = (tag, classes = [], parent = null, attrs = {}, states = []) => ({ tag, classes: new Set(classes), parent, attrs, states: new Set(states) });
const tokens = compound => compound.match(/:not\([^()]+\)|\[[^\]]+\]|\.[\w-]+|:[\w-]+|^[\w-]+/g) ?? [];
const matchesCompound = (compound, node) => {
  const parts = tokens(compound);
  assert.equal(parts.join(""), compound, `unmodelled selector: ${compound}`);
  return parts.every(part => {
    if (part.startsWith(":not(")) return !matchesCompound(part.slice(5, -1), node);
    if (part[0] === ".") return node.classes.has(part.slice(1));
    if (part[0] === ":") return node.states.has(part.slice(1));
    if (part[0] === "[") {
      const [, key, , value] = part.match(/^\[([\w-]+)(?:=(["'])(.*?)\2)?\]$/) ?? [];
      assert.ok(key, part);
      return key in node.attrs && (value === undefined || node.attrs[key] === value);
    }
    return node.tag === part;
  });
};
const matches = (selector, node) => {
  const parts = selector.trim().split(/\s+/);
  if (!matchesCompound(parts.pop(), node)) return false;
  for (const part of parts.reverse()) {
    node = node.parent;
    while (node && !matchesCompound(part, node)) node = node.parent;
    if (!node) return false;
  }
  return true;
};
export const specificity = selector => selector.trim().split(/\s+/).flatMap(tokens).reduce((s, part) => {
  if (part.startsWith(":not(")) return s + specificity(part.slice(5, -1));
  return s + (/^[a-z]/i.test(part) ? 1 : 100);
}, 0);
const expanded = (prop, value) => {
  if (prop === "border" && value === "0") return [["border-width", "0"], ["border-color", "currentColor"]];
  if (prop === "background" && /^var\(--[\w-]+\)$/.test(value)) return [["background-color", value]];
  if (prop === "padding") return ["padding-block-start", "padding-block-end", "padding-inline-start", "padding-inline-end"].map(p => [p, value]);
  if (prop === "padding-inline") return [["padding-inline-start", value], ["padding-inline-end", value]];
  return [[prop, value]];
};
const parsed = new Map();
export const cascade = (css, node, { hover = true, forcedColors = false } = {}) => {
  if (!parsed.has(css)) parsed.set(css, postcss.parse(css));
  const ast = parsed.get(css), winners = new Map();
  ast.walkRules(rule => {
    if (rule.parent.type === "atrule") {
      const media = rule.parent.params;
      if (media === "(hover: hover)" && !hover) return;
      if (media === "(forced-colors: active)" && !forcedColors) return;
      assert.ok(["(hover: hover)", "(forced-colors: active)"].includes(media), media);
    }
    for (const selector of rule.selector.split(",")) {
      if (!matches(selector, node)) continue;
      const weight = specificity(selector);
      rule.walkDecls(d => {
        assert.ok(!d.important, "important is outside the model");
        for (const [prop, value] of expanded(d.prop, d.value)) {
          const previous = winners.get(prop);
          if (!previous || previous.weight <= weight) winners.set(prop, { value, weight, selector: selector.trim() });
        }
      });
    }
  });
  const parent = node.parent ? cascade(css, node.parent, { hover, forcedColors }) : null;
  const raw = prop => winners.get(prop)?.value ?? (prop.startsWith("--") || prop === "color" ? parent?.value(prop) : undefined);
  const value = (prop, stack = []) => {
    assert.ok(!stack.includes(prop), `variable cycle: ${stack}, ${prop}`);
    const result = raw(prop);
    return result?.replace(/var\((--[\w-]+)\)/g, (_, key) => {
      const replacement = value(key, [...stack, prop]);
      assert.ok(replacement !== undefined, `undefined ${key} for ${prop}`);
      return replacement;
    });
  };
  return { value, winner: prop => winners.get(prop), raw };
};
