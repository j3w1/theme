/* The semantic roles every approved profile must define and resolve.
   Adding a role here is a MINOR change; removing or renaming one is MAJOR.
   Paths are token paths (dot separated); the CSS custom property is the same
   path with dots replaced by dashes and a leading `--`
   (color.interaction.focus.ring → --color-interaction-focus-ring). */

const under = (prefix, roles) => roles.map((role) => `${prefix}.${role}`);

export const REQUIRED_COLOR_ROLES = [
  ...under("color.surface", ["desktop", "canvas", "chrome", "chrome-alt", "sunken", "default", "raised", "overlay", "input", "backdrop", "code", "terminal"]),
  ...under("color.text", ["default", "bright", "prose", "muted", "subtle", "disabled", "placeholder", "accent", "accent-strong", "link", "link-underline", "link-hover", "on-selection", "on-action", "on-danger", "on-light", "inverse"]),
  ...under("color.border", ["divider", "default", "strong", "control", "active", "overlay", "disabled", "selected-indicator", "selected-indicator-inactive"]),
  ...under("color.interaction.focus", ["ring", "ring-container"]),
  ...under("color.interaction.selection", ["bg", "text", "inactive-bg", "inactive-text"]),
  ...under("color.interaction.text-selection", ["bg", "text"]),
  ...under("color.interaction.hover", ["bg", "bg-strong"]),
  ...under("color.interaction.pressed", ["bg"]),
  ...under("color.interaction.disabled", ["bg"]),
  ...under("color.interaction", ["marquee", "drop-target"]),
  ...under("color.interaction.scrollbar", ["track", "thumb", "thumb-hover"]),
  ...under("color.action.primary", ["bg", "text", "hover-bg", "pressed-bg", "border"]),
  ...under("color.action.secondary", ["bg", "text", "border", "hover-bg", "pressed-bg"]),
  ...under("color.action.tertiary", ["text", "hover-bg"]),
  ...under("color.action.destructive", ["text", "border", "hover-bg", "hover-text", "pressed-bg", "filled-bg", "filled-text"]),
  ...["danger", "warning", "success", "info", "neutral"].flatMap((s) => under(`color.status.${s}`, ["text", "fill", "on-fill", "tint", "border"])),
  ...under("color.code", ["bg", "current-line", "gutter-bg", "line-number", "line-number-active", "gutter-rule", "caret", "selection-bg", "search-match-bg", "search-current-bg", "search-current-text", "bracket-match", "indent-guide", "whitespace"]),
  ...under("color.code.syntax", ["keyword", "string", "comment", "number", "constant", "function", "variable", "type", "operator", "punctuation", "property", "heading", "tag", "attribute", "escape", "invalid", "deprecated"]),
  ...under("color.diagnostic.error", ["underline", "text", "stripe", "bg"]),
  ...under("color.diagnostic.warning", ["underline", "text", "stripe"]),
  ...under("color.diagnostic.info", ["underline", "text"]),
  ...under("color.diagnostic.hint", ["underline"]),
  ...under("color.diagnostic.unused", ["text"]),
  ...under("color.diff.added", ["bg", "gutter", "emphasis"]),
  ...under("color.diff.removed", ["bg", "gutter", "emphasis"]),
  ...under("color.diff.modified", ["bg", "gutter"]),
  ...under("color.diff", ["conflict-border", "header-bg"]),
  ...under("color.terminal", ["bg", "fg", "cursor", "selection-bg", "selection-text"]),
  ...under("color.terminal.ansi", Array.from({ length: 16 }, (_, i) => String(i))),
  ...under("color.chart", ["series-1", "series-2", "series-3", "series-4", "axis", "grid", "label"]),
  ...under("color.icon", ["default", "decorative"]),
];

export const REQUIRED_FOUNDATION_ROLES = [
  ...under("space", ["0", "1", "2", "4", "8", "12", "16", "24", "32", "48"]),
  ...under("border.width", ["default", "emphasis"]),
  "radius.none",
  "font.family.mono",
  ...under("font.weight", ["regular", "bold"]),
  ...under("font.size", ["ui-sm", "ui-md", "ui-lg", "reading", "code", "terminal", "h1", "h2", "h3", "caption"]),
  ...under("font.line-height", ["ui-sm", "ui-md", "ui-lg", "reading", "code", "terminal", "h1", "h2", "h3", "caption"]),
  "font.letter-spacing.terminal",
  ...["compact", "comfortable"].flatMap((d) => under(`density.${d}`, ["control-height", "row-height", "control-padding-x", "icon", "gap"])),
  ...under("focus", ["ring", "ring-container", "offset", "offset-container", "offset-invalid"]),
  ...under("motion.duration", ["fast", "base", "slow"]),
  "shadow.floating",
  ...under("layout", ["measure", "content-max", "app-max"]),
  ...under("breakpoint", ["xs", "sm", "md", "lg"]),
  ...under("icon.size", ["sm", "md", "lg"]),
  "icon.stroke",
  ...under("z", ["canvas", "raised", "popover", "drawer", "dialog", "toast", "skip-link"]),
];

export const REQUIRED_ROLES = [...REQUIRED_COLOR_ROLES, ...REQUIRED_FOUNDATION_ROLES];

/* The historical sixteen slots, exact. color.primitive.ansi.* must match
   these byte for byte in every profile. */
export const HERITAGE_ANSI = [
  "#0c0909", "#c81a1a", "#bd787d", "#d4868b", "#8c1212", "#f73f35", "#9e474a", "#ffa2a7",
  "#7d1310", "#ab1612", "#ad2721", "#b37175", "#871f19", "#e82132", "#e0292f", "#a3676b",
];

/* Extension hues (D-001) may appear only under these color groups. */
export const EXTENSION_HUES = ["#c9973f", "#86a46f", "#7e9ebb", "#1f1a0c", "#0f1a0e", "#0f141c", "#7fbf7a", "#d6a24b", "#9ab3c9"];
export const EXTENSION_ALLOWED_GROUPS = ["status", "diagnostic", "diff", "code", "terminal", "chart"];
