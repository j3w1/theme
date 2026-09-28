/* Obsidian 1.13.x text artifacts. mapping.json owns native key → role
   assignments; this module owns only the audited CSS shape. No upstream CSS
   is bundled and generation never fetches the host or its documentation. */
import { toCss } from "./tokens.mjs";
import { stableJson } from "./fs.mjs";
import { REQUIRED_ROLES } from "../../schemas/roles.mjs";

export const OBSIDIAN_MIN_APP_VERSION = "1.13.4";
// The public 1.13.4 floor and 1.13.7 source expose every hook below. See README.
export const OBSIDIAN_VARIABLE_TYPES = {
  "--background-primary": "color",
  "--background-primary-alt": "color",
  "--background-secondary": "color",
  "--settings-background": "color",
  "--setting-items-background": "color",
  "--modal-sidebar-background": "color",
  "--search-result-background": "color",
  "--background-secondary-alt": "color",
  "--menu-background": "color",
  "--suggestion-background": "color",
  "--prompt-background": "color",
  "--background-modifier-message": "color",
  "--raised-background": "color",
  "--modal-background": "color",
  "--background-modifier-form-field": "color",
  "--background-modifier-form-field-hover": "color",
  "--dropdown-background": "color",
  "--ribbon-background": "color",
  "--ribbon-background-collapsed": "color",
  "--titlebar-background": "color",
  "--tab-container-background": "color",
  "--status-bar-background": "color",
  "--file-header-background": "color",
  "--titlebar-background-focused": "color",
  "--file-header-background-focused": "color",
  "--background-modifier-cover": "color",
  "--text-normal": "color",
  "--nav-item-color": "color",
  "--nav-heading-color": "color",
  "--titlebar-text-color-focused": "color",
  "--metadata-input-text-color": "color",
  "--bold-color": "color",
  "--italic-color": "color",
  "--inline-title-color": "color",
  "--setting-group-heading-color": "color",
  "--h1-color": "color",
  "--h2-color": "color",
  "--h3-color": "color",
  "--h4-color": "color",
  "--h5-color": "color",
  "--h6-color": "color",
  "--text-muted": "color",
  "--titlebar-text-color": "color",
  "--status-bar-text-color": "color",
  "--tab-text-color": "color",
  "--tab-text-color-focused": "color",
  "--metadata-label-text-color": "color",
  "--nav-heading-color-collapsed": "color",
  "--nav-tag-color": "color",
  "--text-faint": "color",
  "--list-marker-color": "color",
  "--input-placeholder-color": "color",
  "--text-accent": "color",
  "--color-accent": "color",
  "--nav-item-color-highlighted": "color",
  "--tab-text-color-focused-highlighted": "color",
  "--link-color": "color",
  "--link-external-color": "color",
  "--link-unresolved-color": "color",
  "--link-color-hover": "color",
  "--link-external-color-hover": "color",
  "--text-accent-hover": "color",
  "--background-modifier-border": "color",
  "--checkbox-border-color": "color",
  "--slider-thumb-border-color": "color",
  "--background-modifier-border-hover": "color",
  "--checkbox-border-color-hover": "color",
  "--divider-color-hover": "color",
  "--divider-color": "color",
  "--tab-divider-color": "color",
  "--status-bar-border-color": "color",
  "--hr-color": "color",
  "--table-border-color": "color",
  "--metadata-divider-color": "color",
  "--code-border-color": "color",
  "--tab-outline-color": "color",
  "--modal-border-color": "color",
  "--menu-border-color": "color",
  "--prompt-border-color": "color",
  "--background-modifier-border-focus": "color",
  "--nav-item-background-active": "color",
  "--nav-item-background-selected": "color",
  "--tab-background-active": "color",
  "--table-selection": "color",
  "--nav-item-color-active": "color",
  "--nav-item-color-selected": "color",
  "--tab-text-color-focused-active": "color",
  "--tab-text-color-focused-active-current": "color",
  "--tab-text-color-active": "color",
  "--text-selection": "color",
  "--background-modifier-hover": "color",
  "--nav-item-background-hover": "color",
  "--dropdown-background-hover": "color",
  "--background-modifier-active-hover": "color",
  "--scrollbar-bg": "color",
  "--scrollbar-thumb-bg": "color",
  "--scrollbar-active-thumb-bg": "color",
  "--interactive-accent": "color",
  "--checkbox-color": "color",
  "--text-on-accent": "color",
  "--checkbox-marker-color": "color",
  "--toggle-thumb-color": "color",
  "--interactive-accent-hover": "color",
  "--checkbox-color-hover": "color",
  "--interactive-normal": "color",
  "--interactive-hover": "color",
  "--icon-color": "color",
  "--icon-color-hover": "color",
  "--icon-color-focused": "color",
  "--icon-color-active": "color",
  "--text-error": "color",
  "--callout-error": "color",
  "--callout-fail": "color",
  "--callout-bug": "color",
  "--background-modifier-error": "color",
  "--background-modifier-error-hover": "color",
  "--text-warning": "color",
  "--callout-warning": "color",
  "--text-success": "color",
  "--callout-success": "color",
  "--background-modifier-success": "color",
  "--callout-info": "color",
  "--code-background": "color",
  "--caret-color": "color",
  "--text-highlight-bg": "color",
  "--indentation-guide-color": "color",
  "--indentation-guide-color-active": "color",
  "--code-normal": "color",
  "--code-comment": "color",
  "--code-function": "color",
  "--code-important": "color",
  "--code-keyword": "color",
  "--code-operator": "color",
  "--code-property": "color",
  "--code-punctuation": "color",
  "--code-string": "color",
  "--code-tag": "color",
  "--code-value": "color",
  "--font-interface-theme": "fontFamily",
  "--font-text-theme": "fontFamily",
  "--font-monospace-theme": "fontFamily",
  "--font-normal": "fontWeight",
  "--font-bold": "fontWeight",
  "--border-width": "dimension",
  "--input-border-width": "dimension",
  "--divider-width": "dimension",
  "--modal-border-width": "dimension",
  "--menu-border-width": "dimension",
  "--prompt-border-width": "dimension",
  "--code-border-width": "dimension",
  "--slider-thumb-border-width": "dimension",
  "--radius-s": "dimension",
  "--radius-m": "dimension",
  "--radius-l": "dimension",
  "--radius-xl": "dimension",
  "--input-radius": "dimension",
  "--search-input-radius": "dimension",
  "--button-radius": "dimension",
  "--checkbox-radius": "dimension",
  "--toggle-radius": "dimension",
  "--toggle-thumb-radius": "dimension",
  "--slider-thumb-radius": "dimension",
  "--modal-radius": "dimension",
  "--menu-radius": "dimension",
  "--tab-radius": "dimension",
  "--tab-radius-active": "dimension",
  "--tab-curve": "dimension",
  "--nav-item-radius": "dimension",
  "--nav-tag-radius": "dimension",
  "--code-radius": "dimension",
  "--tag-radius": "dimension",
  "--pill-radius": "dimension",
  "--status-bar-radius": "dimension",
  "--scrollbar-radius": "dimension",
  "--callout-radius": "dimension",
  "--metadata-property-radius": "dimension",
  "--metadata-property-radius-hover": "dimension",
  "--metadata-property-radius-focus": "dimension",
  "--setting-items-radius": "dimension",
  "--touch-radius-xxs": "dimension",
  "--touch-radius-xs": "dimension",
  "--touch-radius-s": "dimension",
  "--touch-radius-m": "dimension",
  "--touch-radius-xl": "dimension"
};

// Obsidian sets these mapped variables again on compound dark-mode roots.
// Match each native root's specificity and emit later, reusing the mapped role.
export const OBSIDIAN_ROOT_VARIANTS = [
  {
    selector: ".theme-dark.is-mobile",
    keys: [
      "--search-result-background", "--background-modifier-form-field",
      "--background-modifier-cover", "--background-modifier-hover",
      "--background-modifier-message", "--modal-border-color",
      "--settings-background", "--setting-items-background",
      "--modal-background", "--interactive-normal", "--interactive-hover"
    ]
  },
  { selector: ".theme-dark.is-mobile.is-tablet", keys: ["--settings-background"] },
  { selector: ".theme-dark.is-tablet", keys: ["--titlebar-background", "--titlebar-background-focused"] },
  { selector: ".theme-dark.is-phone", keys: ["--modal-sidebar-background"] }
];

export const OBSIDIAN_RULES = [
  {
    "selector": ".theme-dark .markdown-preview-view",
    "properties": {
      "color": "color"
    },
    "reason": "Reading View root uses --text-normal, also used by UI; set only note content color."
  },
  {
    "selector": ".theme-dark .markdown-source-view.mod-cm6 .cm-content",
    "properties": {
      "color": "color"
    },
    "reason": "CM6 content root separates prose from interface widgets."
  },
  {
    "selector": ".theme-dark .markdown-source-view.mod-cm6 .cm-scroller",
    "properties": {
      "--text-selection": "color"
    },
    "reason": "CM6 scroller contains both content and the sibling drawn-selection layer; scope editor selection above both."
  },
  {
    "selector": ".theme-dark .popover",
    "properties": {
      "--background-primary": "color"
    },
    "reason": "File preview popovers use the canvas variable locally; raised content requires a scoped value."
  },
  {
    "selector": ".theme-dark .tooltip",
    "properties": {
      "color": "color",
      "border-color": "color",
      "border-width": "dimension"
    },
    "reason": "Native tooltip hardcodes white text and has no border variables.",
    "fixed": {
      "border-style": "solid",
      "box-shadow": "none"
    }
  },
  {
    "selector": ".theme-dark .tooltip.mod-error",
    "properties": {
      "color": "color"
    },
    "reason": "Native error tooltip fills with --background-modifier-error and needs its own on-fill text."
  },
  {
    "selector": ".theme-dark .prompt input.prompt-input",
    "properties": {
      "background-color": "color",
      "border-color": "color",
      "border-width": "dimension",
      "padding-block": "dimension",
      "padding-inline-start": "dimension",
      "min-height": "dimension"
    },
    "reason": "Native prompt field needs a fill and border; compact start padding preserves the native clear-button end reservation.",
    "fixed": {
      "height": "auto",
      "border-style": "solid"
    }
  },
  {
    "selector": ".theme-dark .prompt input.prompt-input:focus-visible",
    "properties": {
      "outline": "border",
      "outline-offset": "dimension"
    },
    "reason": "Native prompt suppresses input focus shadows; add exactly one inset dashed ring.",
    "fixed": {
      "box-shadow": "none"
    }
  },
  {
    "selector": ".theme-dark .prompt .suggestion-item",
    "properties": {
      "min-height": "dimension",
      "padding-block": "dimension",
      "padding-inline": "dimension",
      "border-inline-start-width": "dimension"
    },
    "reason": "Native suggestions have fixed padding but no density or selection indicator variable.",
    "fixed": {
      "border-inline-start-style": "solid",
      "border-inline-start-color": "transparent"
    }
  },
  {
    "selector": ".theme-dark .prompt .suggestion-item.is-selected",
    "properties": {
      "background-color": "color",
      "color": "color",
      "border-inline-start-color": "color",
      "--text-muted": "color",
      "--text-faint": "color",
      "--text-accent": "color"
    },
    "reason": "Separate selection and its indicator; local text variables keep notes, flair, faint text and actions readable on the selected fill."
  },
  {
    "selector": ".theme-dark .menu",
    "properties": {
      "--background-modifier-hover": "color"
    },
    "reason": "Menus consume general hover fill; local strong hover keeps other surfaces restrained."
  },
  {
    "selector": ".theme-dark .tree-item-self",
    "properties": {
      "border-inline-start-width": "dimension"
    },
    "reason": "Reserve the selected tree indicator in every state so labels do not move.",
    "fixed": {
      "border-inline-start-style": "solid",
      "border-inline-start-color": "transparent"
    }
  },
  {
    "selector": ".theme-dark .tree-item-self.is-active",
    "properties": {
      "border-inline-start-color": "color",
      "border-inline-start-width": "dimension"
    },
    "reason": "Native navigation active fill has no selected-indicator variable.",
    "fixed": {
      "border-inline-start-style": "solid"
    }
  },
  {
    "selector": ".theme-dark .tree-item-self.is-selected",
    "properties": {
      "border-inline-start-color": "color",
      "border-inline-start-width": "dimension"
    },
    "reason": "Native navigation selected fill has no selected-indicator variable.",
    "fixed": {
      "border-inline-start-style": "solid"
    }
  },
  {
    "selector": ".theme-dark .workspace-tab-header-container .workspace-tab-header",
    "properties": {
      "border-bottom-width": "dimension"
    },
    "reason": "Reserve the tab indicator in every state so main and sidebar tab labels do not move.",
    "fixed": {
      "border-bottom-style": "solid",
      "border-bottom-color": "transparent"
    }
  },
  {
    "selector": ".theme-dark .workspace-tab-header-container .workspace-tab-header.is-active",
    "properties": {
      "background-color": "color",
      "border-bottom-color": "color",
      "border-bottom-width": "dimension"
    },
    "reason": "Sidebar tabs use hover fill and main tabs lack an indicator; one named-state override covers both.",
    "fixed": {
      "border-bottom-style": "solid"
    }
  },
  {
    "selector": ".theme-dark button:not(.clickable-icon)",
    "properties": {
      "border-width": "dimension",
      "border-color": "color",
      "--text-color": "color"
    },
    "reason": "Native standard buttons use shadow as their boundary; supply a real outline edge after removing decorative shadows.",
    "fixed": {
      "border-style": "solid"
    }
  },
  {
    "selector": ".theme-dark button.mod-cta",
    "properties": {
      "--background-modifier-border-focus": "color",
      "border-color": "color",
      "--text-color": "color"
    },
    "reason": "Recolor the existing native button focus shadow on primary fills; do not add another indicator."
  },
  {
    "selector": ".theme-dark .checkbox-container.is-enabled",
    "properties": {
      "--background-modifier-border-focus": "color"
    },
    "reason": "Recolor the existing toggle outline on primary fill."
  },
  {
    "selector": ".theme-dark input[type=\"checkbox\"]:checked",
    "properties": {
      "--background-modifier-border-focus": "color"
    },
    "reason": "Recolor the native checkbox focus shadow when checked."
  },
  {
    "selector": ".theme-dark input[type=\"radio\"]:checked",
    "properties": {
      "--background-modifier-border-focus": "color"
    },
    "reason": "Recolor the native radio focus shadow when checked."
  },
  {
    "selector": ".theme-dark button.mod-destructive",
    "properties": {
      "border-color": "color",
      "--text-color": "color"
    },
    "reason": "Restore plain destructive text and border after the standard-button rule; confirmation variants override the text below."
  },
  {
    "selector": ".theme-dark button.mod-destructive:hover",
    "properties": {
      "background-color": "color",
      "--text-color": "color",
      "--background-modifier-border-focus": "color"
    },
    "reason": "Destructive hover uses its canonical fill and on-fill text; recolor the single native focus shadow on that fill.",
    "media": "(hover: hover)"
  },
  {
    "selector": ".theme-dark button.mod-destructive.mobile-tap",
    "properties": {
      "background-color": "color",
      "--text-color": "color",
      "--background-modifier-border-focus": "color"
    },
    "reason": "Native mobile-tap otherwise borrows the secondary hover fill with unsafe danger text; retain destructive meaning with its hover pair."
  },
  {
    "selector": ".theme-dark button.mod-warning",
    "properties": {
      "border-color": "color",
      "--text-color": "color",
      "--background-modifier-border-focus": "color"
    },
    "reason": "Native warning buttons keep desktop error fills and the mobile neutral fill; recolor desktop text and the existing focus shadow."
  },
  {
    "selector": ".theme-dark button.mod-destructive.mod-cta",
    "properties": {
      "border-color": "color",
      "--text-color": "color",
      "--background-modifier-border-focus": "color"
    },
    "reason": "Native destructive confirmation fill requires on-danger text and native focus shadow color."
  },
  {
    "selector": ".theme-dark select",
    "properties": {
      "border-width": "dimension",
      "border-color": "color"
    },
    "reason": "Native select uses decorative input shadow as its edge; replace with a real control border.",
    "fixed": {
      "border-style": "solid"
    }
  },
  {
    "selector": ".theme-dark .dropdown",
    "properties": {
      "border-width": "dimension",
      "border-color": "color"
    },
    "reason": "Native dropdown uses input shadow as its edge; replace with a real control border.",
    "fixed": {
      "border-style": "solid"
    }
  },
  {
    "selector": ".theme-dark .combobox-button",
    "properties": {
      "border-width": "dimension",
      "border-color": "color"
    },
    "reason": "Native combobox button uses input shadow as its edge; replace with a real control border.",
    "fixed": {
      "border-style": "solid"
    }
  },
  {
    "selector": ".theme-dark button:not(.clickable-icon)[disabled]",
    "properties": {
      "--text-color": "color",
      "color": "color",
      "background-color": "color",
      "border-color": "color"
    },
    "reason": "Native disabled button uses opacity; explicit disabled roles retain contrast accounting.",
    "fixed": {
      "opacity": "1"
    }
  },
  {
    "selector": ".theme-dark button:not(.clickable-icon)[aria-disabled=\"true\"]",
    "properties": {
      "--text-color": "color",
      "color": "color",
      "background-color": "color",
      "border-color": "color"
    },
    "reason": "Native disabled button uses opacity; explicit disabled roles retain contrast accounting.",
    "fixed": {
      "opacity": "1"
    }
  },
  {
    "selector": ".theme-dark .prompt input.prompt-input:hover",
    "properties": {
      "background-color": "color",
      "border-color": "color"
    },
    "reason": "Native prompt hover forces transparency and its bottom border; retain field fill and visible boundary.",
    "media": "(hover: hover)"
  },
  {
    "selector": ".theme-dark .workspace-tab-header-container .workspace-tab-header.is-active:hover",
    "properties": {
      "background-color": "color"
    },
    "reason": "Native sidebar active hover borrows hover fill; selection takes precedence.",
    "media": "(hover: hover)"
  },
  {
    "selector": ".theme-dark:not(.is-focused) .workspace-tab-header-container .workspace-tab-header.is-active",
    "properties": {
      "background-color": "color",
      "border-bottom-color": "color"
    },
    "reason": "Native tabs have inactive text but no inactive fill or indicator variables."
  },
  {
    "selector": ".theme-dark .prompt .suggestion-action",
    "properties": {},
    "fixed": {
      "color": "var(--text-accent)"
    },
    "reason": "Native actions use the primary fill as text; use the text accent, whose selected-row scope supplies readable on-selection text."
  }
];

const RESET_VARIABLES = {
  "--input-shadow": "none", "--input-shadow-hover": "none",
  "--shadow-xs": "none", "--shadow-s": "none", "--shadow-l": "none",
  "--menu-shadow": "none", "--raised-shadow": "none",
  "--slider-thumb-shadow": "none", "--slider-thumb-shadow-hover": "none", "--slider-thumb-shadow-active": "none",
  "--raised-blur": "none", "--prompt-backdrop-filter": "none", "--suggestion-backdrop-filter": "none",
  "--menu-backdrop-filter": "none", "--raised-mask-display": "none",
  "--link-decoration": "underline", "--link-decoration-hover": "underline",
  "--link-external-decoration": "underline", "--link-external-decoration-hover": "underline",
  "--link-unresolved-opacity": "1", "--icon-opacity": "1"
};
const keyTypes = () => new Map([
  ...Object.entries(OBSIDIAN_VARIABLE_TYPES),
  ...OBSIDIAN_RULES.flatMap(rule => Object.entries(rule.properties).map(([property, type]) => [`${rule.selector} | ${property}`, type]))
]);
export const obsidianCss = ({ manifest, port, mapping, resolved }) => {
  if (port.profile !== "default") throw new Error("Obsidian v1 requires the default profile");
  const types = keyTypes(), values = new Map();
  for (const [role, keys] of Object.entries(mapping.mappings)) {
    if (!REQUIRED_ROLES.includes(role)) throw new Error(`Obsidian requires a semantic role: ${role}`);
    const token = resolved.get(role);
    if (!token) throw new Error(`Obsidian role absent from profile: ${role}`);
    for (const key of keys) {
      if (!types.has(key)) throw new Error(`Unknown Obsidian native key: ${key}`);
      if (values.has(key)) throw new Error(`Duplicate Obsidian native key: ${key}`);
      if (token.type !== types.get(key)) throw new Error(`Obsidian ${key} requires ${types.get(key)}, got ${token.type}`);
      values.set(key, toCss(token.type, token.resolved));
    }
  }
  for (const key of types.keys()) if (!values.has(key)) throw new Error(`Missing Obsidian native key: ${key}`);
  const block = (selector, entries) => `${selector} {\n${entries.map(([key, value]) => `  ${key}: ${value};`).join("\n")}\n}\n`;
  let css = `/* j3w1 theme ${manifest.version}, default profile, for Obsidian.\n * Generated from ports/obsidian/mapping.json by npm run generate; do not edit.\n * MIT; dark only; no font files or runtime dependencies.\n */\n`;
  css += block(".theme-dark", [...Object.keys(OBSIDIAN_VARIABLE_TYPES).map(key => [key, values.get(key)]), ...Object.entries(RESET_VARIABLES)]);
  css += "\n/* Preserve mapped roles where native dark mobile roots redeclare them. */\n";
  for (const { selector, keys } of OBSIDIAN_ROOT_VARIANTS) css += block(selector, keys.map(key => [key, values.get(key)])) + "\n";
  for (const rule of OBSIDIAN_RULES) {
    const body = block(rule.selector, [...Object.keys(rule.properties).map(property => [property, values.get(`${rule.selector} | ${property}`)]), ...Object.entries(rule.fixed ?? {})]);
    css += `\n/* ${rule.reason} */\n` + (rule.media ? `@media ${rule.media} {\n${body}}\n` : body);
  }
  // Native shadows/outlines remain the only indicators; forced colors must
  // recolor them too. The prompt has one replacement outline, never a shadow.
  css += `
@media (forced-colors: active) {
.theme-dark {
  --background-modifier-border-focus: Highlight;
}
.theme-dark button.mod-cta,
.theme-dark button.mod-warning,
.theme-dark button.mod-destructive.mod-cta,
.theme-dark button.mod-destructive:hover,
.theme-dark button.mod-destructive.mobile-tap,
.theme-dark .checkbox-container.is-enabled,
.theme-dark input[type="checkbox"]:checked,
.theme-dark input[type="radio"]:checked {
  --background-modifier-border-focus: Highlight;
}
.theme-dark .prompt input.prompt-input:focus-visible {
  outline-color: Highlight;
}
}
`;
  return css;
};
export const obsidianArtifacts = args => [
  { path: "dist/manifest.json", text: stableJson({ name: "j3w1", version: args.manifest.version, minAppVersion: OBSIDIAN_MIN_APP_VERSION, author: "j3w1", authorUrl: "https://github.com/j3w1" }) },
  { path: "dist/theme.css", text: obsidianCss(args) }
];
