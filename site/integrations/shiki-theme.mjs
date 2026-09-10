/* The theme specifies a complete code palette — color.code.bg and the
   seventeen color.code.syntax.* roles — but the site shipped Astro's default
   github-dark, so every rendered code block carried a foreign blue palette in
   inline style attributes. This builds Shiki's theme from the resolved tokens
   instead, so code blocks render in the theme the page is documenting.

   Values are read from exports/tokens.resolved.json rather than written here:
   the site is confirmation-only (theme.json) and never states a value that is
   not in tokens/. */

import { readFileSync } from "node:fs";

const resolved = JSON.parse(readFileSync(new URL("../../exports/tokens.resolved.json", import.meta.url), "utf8"));

/* The extended overlay, not default. D-001 keeps default's syntax monochrome
   on purpose; the same decision authorises amber, green and blue in the code
   group of this overlay, which is what lets a keyword, a type, a string and a
   number be told apart. The overlay is still `proposed`, so this is the site
   documenting it, not the theme approving it. */
const PROFILE = "extended";

const code = (role) => {
  const token = resolved.profiles[PROFILE]?.tokens[`color.code.${role}`];
  if (!token) throw new Error(`shiki theme: color.code.${role} is not a token in the ${PROFILE} profile`);
  return token.value.hex;
};

/* One TextMate scope list per syntax role. A scope that no role claims falls
   through to the editor foreground, which keeps unmapped grammars monochrome
   rather than letting a bundled default colour them. */
const SCOPES = [
  ["keyword", ["keyword", "storage", "storage.type", "keyword.control", "variable.language"]],
  ["string", ["string", "string.quoted", "string.template", "meta.string"]],
  ["comment", ["comment", "punctuation.definition.comment"]],
  ["number", ["constant.numeric"]],
  ["constant", ["constant", "constant.language", "support.constant"]],
  ["function", ["entity.name.function", "support.function", "meta.function-call"]],
  ["variable", ["variable", "meta.definition.variable", "variable.other"]],
  ["type", ["entity.name.type", "support.type", "support.class", "entity.name.class"]],
  ["operator", ["keyword.operator"]],
  ["punctuation", ["punctuation", "meta.brace", "punctuation.separator", "punctuation.terminator"]],
  ["property", ["variable.other.property", "support.type.property-name", "meta.object-literal.key"]],
  ["heading", ["markup.heading", "entity.name.section"]],
  ["tag", ["entity.name.tag", "punctuation.definition.tag"]],
  ["attribute", ["entity.other.attribute-name"]],
  ["escape", ["constant.character.escape"]],
  ["invalid", ["invalid", "invalid.illegal"]],
  ["deprecated", ["invalid.deprecated", "markup.deleted"]],
];

export const shikiTheme = () => ({
  name: "j3w1",
  type: "dark",
  colors: {
    "editor.background": code("bg"),
    "editor.foreground": code("syntax.variable"),
    "editor.lineHighlightBackground": code("current-line"),
    "editor.selectionBackground": code("selection-bg"),
    "editorLineNumber.foreground": code("line-number"),
    "editorLineNumber.activeForeground": code("line-number-active"),
    "editorCursor.foreground": code("caret"),
    "editorIndentGuide.background": code("indent-guide"),
    "editorWhitespace.foreground": code("whitespace"),
    "editorBracketMatch.border": code("bracket-match"),
  },
  settings: [
    { settings: { background: code("bg"), foreground: code("syntax.variable") } },
    ...SCOPES.map(([role, scope]) => ({ scope, settings: { foreground: code(`syntax.${role}`) } })),
  ],
});
