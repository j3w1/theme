import postcss from "postcss";
import valueParser from "postcss-value-parser";
import { cssVar, toCss } from "./tokens.mjs";
import { eligibilityOf } from "./eligibility.mjs";

export const RECIPE_SCOPE = ".j3w1-recipe";
export const scopeRecipeCss = (source, { removeClasses = [] } = {}) => {
  const root = postcss.parse(source);
  root.walkComments((comment) => comment.remove());
  root.walkAtRules((rule) => {
    if (!["media", "supports", "container"].includes(rule.name)) throw new Error(`Unsupported recipe CSS dependency: @${rule.name}`);
  });
  root.walkRules((rule) => {
    const selectors = rule.selectors.filter((s) => !s.includes("[data-state-") && !removeClasses.some((name) => s.includes(`.${name}`)));
    if (!selectors.length) return rule.remove();
    rule.selectors = selectors.map((s) => s === "&" ? RECIPE_SCOPE : `${RECIPE_SCOPE} ${s}`);
  });
  root.walkDecls((decl) => {
    const value = valueParser(decl.value);
    value.walk((node) => {
      if (node.type === "function" && node.value.toLowerCase() === "url") throw new Error("Recipe assets must be declared; CSS url() is not supported.");
      if (node.type !== "word") return;
      const unit = valueParser.unit(node.value);
      if (unit?.unit === "rem") {
        node.type = "function";
        node.value = "calc";
        node.nodes = valueParser(`var(--font-size-ui-md) * ${unit.number}`).nodes;
      }
    });
    decl.value = value.toString();
  });
  return `${root.toString().trim()}\n`;
};

export const recipeTokenCss = (styles, resolved, profile) => {
  const used = new Set();
  const defined = new Set();
  const css = postcss.parse(styles.join("\n"));
  css.walkDecls((d) => { if (d.prop.startsWith("--")) defined.add(d.prop); });
  css.walkDecls((d) => valueParser(d.value).walk((node) => {
    if (node.type === "function" && node.value === "var") {
      const variable = node.nodes.find((n) => n.type === "word")?.value;
      if (!variable?.startsWith("--")) throw new Error("Malformed recipe variable dependency");
      used.add(variable);
    }
  }));
  const byVariable = new Map([...resolved.keys()].map((p) => [cssVar(p), p]));
  const paths = new Set();
  const roles = new Set();
  const add = (path) => {
    if (paths.has(path)) return;
    const token = resolved.get(path);
    if (!token) throw new Error(`Missing recipe token: ${path}`);
    paths.add(path);
    for (const dependency of token.chain ?? []) add(dependency);
  };
  const density = [];
  for (const variable of [...used].sort()) {
    if (defined.has(variable)) continue;
    /* A mode-qualified density variable such as --density-comfortable-row-height
       names a role in its own right, and a component may pin to it deliberately
       — a table row stays comfortable whatever the page density. Resolve any
       variable that is a real role before falling back to the per-mode
       expansion, which is only for the unqualified --density-<key> aliases. */
    if (byVariable.has(variable)) {
      const path = byVariable.get(variable);
      roles.add(path); add(path);
    } else if (variable.startsWith("--density-")) {
      for (const mode of ["compact", "comfortable"]) {
        const path = `density.${mode}.${variable.slice("--density-".length)}`;
        roles.add(path); add(path);
        density.push({ mode, variable, path });
      }
    } else {
      const path = byVariable.get(variable);
      if (!path) throw new Error(`Missing recipe CSS dependency: ${variable}`);
      roles.add(path); add(path);
    }
  }
  const eligibility = Object.fromEntries([...roles].sort().map((p) => [p, eligibilityOf(profile, resolved.get(p), resolved)]));
  for (const [role, policy] of Object.entries(eligibility)) if (!["use", "use-and-report"].includes(policy.action)) throw new Error(`Recipe role ${role}: ${policy.action}: ${policy.reason}`);
  const lines = [`${RECIPE_SCOPE} {`, ...[...paths].sort().map((p) => `  ${cssVar(p)}: ${toCss(resolved.get(p).type, resolved.get(p).resolved)};`), "}"];
  for (const mode of ["compact", "comfortable"]) lines.push(`${RECIPE_SCOPE}[data-density="${mode}"] {`, ...density.filter((d) => d.mode === mode).map((d) => `  ${d.variable}: var(${cssVar(d.path)});`), "}");
  return { css: `${lines.join("\n")}\n`, paths: [...paths].sort(), roles: [...roles].sort(), eligibility };
};
