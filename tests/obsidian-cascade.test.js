/* Source-derived structural checks on synthetic ancestry/state fixtures.
   No running Obsidian, device, browser or manual accessibility pass is implied. */
import assert from "node:assert/strict";
import test from "node:test";
import postcss from "postcss";
import { readJson, readText } from "../scripts/lib/fs.mjs";
import { loadResolvedProfile, toCss } from "../scripts/lib/tokens.mjs";
import { obsidianArtifacts, OBSIDIAN_ROOT_VARIANTS } from "../scripts/lib/obsidian-port.mjs";
import { evaluatePair } from "../scripts/lib/contrast.mjs";
import { cascade, element, specificity } from "./helpers/obsidian-cascade.mjs";

const manifest = await readJson("theme.json"), port = await readJson("ports/obsidian/port.json"), mapping = await readJson("ports/obsidian/mapping.json");
const resolved = await loadResolvedProfile(manifest.profiles.find(p => p.id === "default").tokens);
const emitted = obsidianArtifacts({ manifest, port, mapping, resolved }).find(f => f.path === "dist/theme.css").text;
const audit = await readJson("tests/fixtures/obsidian-hooks.json");
const role = name => toCss(resolved.get(name).type, resolved.get(name).resolved);
const color = hex => {
  if (hex === "rgb(0 0 0 / 0%)") return { colorSpace: "srgb", components: [0, 0, 0], alpha: 0, hex: "#000000" };
  assert.match(hex, /^#[0-9a-f]{6}$/);
  return { colorSpace: "srgb", components: [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255), alpha: 1, hex };
};
const pair = (fg, bg, min = 4.5) => evaluatePair({ fg: color(fg), bg: color(bg), surface: color(role("color.surface.overlay")), min });
const nativeCss = version => {
  // Test-only projection of normalized facts: exact property, selector,
  // media and source order, independently captured from both app.css files.
  return '.theme-dark { --size-4-6: 24px; --size-4-12: 48px; --color-accent: native-accent; }\n' + [...audit.cascadeFacts, ...audit.rootVariantFacts]
    .toSorted((a, b) => a.lines[version] - b.lines[version])
    .map(f => `${f.media ? `@media ${f.media} {` : ""}${f.selector} { ${f.property}: ${f.value}; }${f.media ? "}" : ""}`).join("\n");
};
const removeRule = (css, selector) => {
  const ast = postcss.parse(css);
  ast.walkRules(r => { if (r.selector === selector) r.remove(); });
  return ast.toString();
};
const body = (mobile = false, focused = true) => element("body", ["theme-dark", ...(mobile ? ["is-mobile"] : []), ...(focused ? ["is-focused"] : [])]);
const owner = Object.fromEntries(Object.entries(mapping.mappings).flatMap(([name, keys]) => keys.map(key => [key, name])));

test("specificity includes :not and variants; same-weight source order remains decisive", () => {
  assert.equal(specificity(".theme-dark button:not(.clickable-icon)"), 201);
  assert.equal(specificity("button.mod-destructive"), 101);
  assert.equal(specificity(".theme-dark button.mod-destructive"), 201);
  assert.equal(specificity(".is-mobile button.mod-warning"), 201);
  assert.equal(specificity('.theme-dark button:not(.clickable-icon)[aria-disabled="true"]'), 301);
  const node = element("button", ["mod-destructive"], body());
  assert.equal(cascade('.theme-dark button { --text-color: first; } .theme-dark button { --text-color: last; }', node).value("--text-color"), "last");
});

for (const { version } of audit.versions) {
  const native = nativeCss(version), css = native + emitted;
  test(`${version}: every audited compound dark root keeps its mapped values`, () => {
    const actual = audit.rootVariantFacts.map(f => `${f.selector} | ${f.property}`).sort();
    const expected = OBSIDIAN_ROOT_VARIANTS.flatMap(({ selector, keys }) => keys.map(key => `${[...selector.matchAll(/\.[\w-]+/g)].map(m => m[0]).toSorted().join("")} | ${key}`)).sort();
    const normalized = actual.map(key => key.replace(/^[^|]+(?= \|)/, selector => [...selector.matchAll(/\.[\w-]+/g)].map(m => m[0]).toSorted().join(""))).sort();
    assert.deepEqual(normalized, expected, "fixture covers every mapped native root collision");
    for (const { selector, keys } of OBSIDIAN_ROOT_VARIANTS) {
      const root = element("body", [...selector.matchAll(/\.([\w-]+)/g)].map(m => m[1]));
      const result = cascade(css, root);
      for (const key of keys) {
        assert.equal(result.value(key), role(owner[key]), `${selector} ${key}`);
        assert.equal(result.winner(key).selector, selector, `${selector} wins ${key}`);
      }
    }
    const mobile = body(true);
    const broken = cascade(native + removeRule(emitted, ".theme-dark.is-mobile"), mobile);
    for (const key of ["--interactive-normal", "--background-modifier-form-field"]) assert.notEqual(broken.value(key), role(owner[key]), key);
  });
  test(`${version}: consumed accent is fixed independently of the user's Accent setting`, () => {
    const root = body();
    assert.equal(cascade(css, root).value("--color-accent"), role("color.text.accent-strong"));
    assert.equal(cascade(native + emitted.replace(/\s+--color-accent: [^;]+;/, ""), root).value("--color-accent"), "native-accent");
    const hook = audit.versions.find(v => v.version === version).hooks["--color-accent"];
    assert.ok(hook.consumerCount > 1);
    const consumers = audit.versions.find(v => v.version === version).accentConsumers;
    for (const selector of [".workspace-leaf-resize-handle.is-active", ".modal-header-button.mod-cta", ".modal .modal-nav-action.mod-cta", ".bases-table-header-resizer.is-active"]) assert.ok(consumers.some(c => c.selector.includes(selector)), selector);
    assert.equal(consumers.length, hook.consumerCount);
    for (const surface of ["color.surface.raised", "color.surface.overlay"]) {
      assert.ok(pair(role("color.text.accent-strong"), role(surface)).pass);
      assert.ok(pair(role("color.text.accent-strong"), role(surface), 3).pass);
    }
  });
  test(`${version}: every native standard/destructive/confirmation variant survives hover, tap, focus and disabled specificity`, () => {
    const variants = [[], ["mod-cta"], ["mod-destructive"], ["mod-warning"], ["mod-destructive", "mod-cta"]];
    for (const mobile of [false, true]) for (const variant of variants) {
      for (const state of ["rest", "hover", "mobile-tap", "focus-visible", "hover+focus-visible"]) {
        for (const disabled of [null, "disabled", "aria-disabled"]) {
          const classes = [...variant, ...(state === "mobile-tap" ? [state] : [])];
          const states = state.split("+").filter(s => s === "hover" || s === "focus-visible");
          const attrs = disabled ? { [disabled]: disabled === "disabled" ? "" : "true" } : {};
          const result = cascade(css, element("button", classes, body(mobile), attrs, states));
          const plainDanger = variant.includes("mod-destructive") && !variant.includes("mod-cta");
          const dangerInteraction = plainDanger && (states.includes("hover") || state === "mobile-tap");
          const filledDanger = variant.includes("mod-warning") || (variant.includes("mod-destructive") && variant.includes("mod-cta"));
          const expected = disabled ? role("color.text.disabled") : mobile && variant.includes("mod-warning") ? role("color.status.danger.text") : filledDanger ? role("color.action.destructive.filled-text") : dangerInteraction ? role("color.action.destructive.hover-text") : plainDanger ? role("color.action.destructive.text") : variant.includes("mod-cta") ? role("color.action.primary.text") : role("color.action.secondary.text");
          assert.equal(result.value("color"), expected, `${variant}/${mobile}/${state}/${disabled}`);
          const border = disabled ? role("color.border.disabled") : (plainDanger || filledDanger) ? role("color.action.destructive.border") : variant.includes("mod-cta") ? role("color.action.primary.border") : role("color.action.secondary.border");
          assert.equal(result.value("border-color"), border);
          const bg = result.value("background-color");
          if (!bg.startsWith("color-mix")) assert.ok(pair(expected, bg, disabled ? 3 : 4.5).pass, `${expected} on ${bg}`);
          else {
            // Native outline tint mixes one opaque error color with transparent.
            assert.equal(bg, `color-mix(in oklch, ${role("color.status.danger.fill")} 10%, transparent)`);
            for (const under of ["color.surface.default", "color.surface.overlay"]) {
              const result = evaluatePair({ fg: color(expected), bg: { ...color(role("color.status.danger.fill")), alpha: 0.1 }, surface: color(role(under)) });
              assert.ok(result.pass, result.ratio);
            }
          }
          if (!disabled && states.includes("focus-visible")) {
            assert.match(result.value("box-shadow"), /^0 0 0 3px /, "one native focus shadow");
            if (!bg.startsWith("color-mix")) assert.ok(pair(result.value("--background-modifier-border-focus"), bg, 3).pass);
          }
        }
      }
    }
    const danger = element("button", ["mod-destructive"], body());
    const broken = cascade(native + removeRule(emitted, ".theme-dark button.mod-destructive"), danger);
    assert.notEqual(broken.value("color"), role("color.action.destructive.text"), "regression detects broad base overriding native danger");
    assert.equal(cascade(css, element("button", ["clickable-icon"], body())).value("--text-color"), role("color.text.default"), "standard border/text rule excludes native icons");
    assert.equal(cascade(css, element("button", ["mod-loading", "mod-destructive"], body())).value("color"), "transparent", "native loading label remains hidden");
    for (const variant of [["mod-cta"], ["mod-warning"], ["mod-destructive", "mod-cta"], ["mod-destructive", "mobile-tap"], ["mod-destructive"]]) {
      const node = element("button", variant, body(), {}, ["hover", "focus-visible"]);
      assert.equal(cascade(css, node, { forcedColors: true }).value("--background-modifier-border-focus"), "Highlight");
    }
  });
  test(`${version}: mobile warning uses the exact safe native foreground/fill pair`, () => {
    const node = element("button", ["mod-warning"], body(true));
    const result = cascade(css, node);
    assert.equal(result.value("color"), role("color.status.danger.text"));
    assert.equal(result.value("background-color"), role("color.action.secondary.bg"));
    assert.equal(result.winner("background-color").selector, ".is-mobile button.mod-warning");
    assert.ok(pair(result.value("color"), result.value("background-color")).pass);
    assert.equal(pair(result.value("color"), result.value("background-color")).display, "4.94", "exact emitted hex values, with the transparent mobile fill composited over the modal overlay");
    const broken = cascade(css + `.theme-dark button.mod-warning { background-color: ${role("color.action.destructive.filled-bg")}; }`, node);
    assert.equal(pair(broken.value("color"), broken.value("background-color")).pass, false);
    assert.equal(pair(broken.value("color"), broken.value("background-color")).display, "1.30");
  });
  test(`${version}: mobile standard buttons and text fields retain readable fills`, () => {
    const root = body(true);
    for (const classes of [[], ["mobile-tap"]]) {
      const result = cascade(css, element("button", classes, root));
      assert.equal(result.value("background-color"), role(classes.length ? "color.action.secondary.hover-bg" : "color.action.secondary.bg"));
      assert.ok(pair(result.value("color"), result.value("background-color")).pass);
    }
    const field = cascade(css, element("input", [], root, { type: "text" }));
    assert.equal(field.value("background-color"), role("color.surface.input"));
    assert.ok(pair(field.value("color"), field.value("background-color")).pass);
    assert.ok(pair(field.value("--input-placeholder-color"), field.value("background-color")).pass);
    const broken = cascade(native + removeRule(emitted, ".theme-dark.is-mobile"), element("input", [], body(true), { type: "text" }));
    assert.equal(pair(broken.value("color"), broken.value("background-color")).pass, false);
  });
  test(`${version}: both prompt entrypoints keep notes, flair, faint children and actions readable in every selected combination`, () => {
    for (const entrypoint of ["command-palette", "quick-switcher"]) for (const mobile of [false, true]) for (const extra of [[], ["mobile-tap"], ["mod-downranked"], ["mobile-tap", "mod-downranked"]]) {
      const prompt = element("div", ["prompt", entrypoint], body(mobile));
      const row = element("div", ["suggestion-item", "mod-complex", "is-selected", ...extra], prompt);
      const bg = cascade(css, row).value("background-color");
      assert.equal(bg, role("color.interaction.selection.bg"));
      for (const child of ["suggestion-note", "suggestion-flair", "suggestion-empty-suggestion", "suggestion-action"]) {
        const fg = cascade(css, element("span", [child], row)).value("color");
        assert.equal(fg, role("color.interaction.selection.text"), child);
        assert.ok(pair(fg, bg).pass, child);
      }
      assert.equal(cascade(css, element("span", ["suggestion-action"], element("div", ["suggestion-item", "mod-complex"], prompt))).value("color"), role("color.text.accent-strong"));
      const selected = ".theme-dark .prompt .suggestion-item.is-selected";
      const ast = postcss.parse(emitted);
      ast.walkRules(r => { if (r.selector === selected) r.walkDecls(d => { if (d.prop.startsWith("--text-")) d.remove(); }); });
      for (const child of ["suggestion-note", "suggestion-flair", "suggestion-empty-suggestion", "suggestion-action"]) assert.equal(pair(cascade(native + ast.toString(), element("span", [child], row)).value("color"), bg).pass, false);
      const style = cascade(css, row);
      assert.equal(style.value("outline"), undefined);
      assert.equal(style.value("box-shadow"), undefined);
    }
  });
  test(`${version}: CM6 content and sibling drawn selection share the editor scope, UI keeps its own fill`, () => {
    for (const mode of ["source-mode", "live-preview"]) {
      const root = body(), view = element("div", ["markdown-source-view", "mod-cm6", mode], root);
      const editor = element("div", ["cm-editor"], view), scroller = element("div", ["cm-scroller"], editor);
      const content = element("div", ["cm-content"], scroller), layer = element("div", ["cm-selectionLayer"], scroller), selection = element("div", ["cm-selectionBackground"], layer);
      for (const node of [content, layer, selection]) assert.equal(cascade(css, node).value("--text-selection"), role("color.code.selection-bg"));
      assert.equal(cascade(css, element("input", [], root)).value("--text-selection"), role("color.interaction.text-selection.bg"));
      const broken = native + emitted.replace(".theme-dark .markdown-source-view.mod-cm6 .cm-scroller", ".theme-dark .markdown-source-view.mod-cm6 .cm-content");
      assert.equal(cascade(broken, selection).value("--text-selection"), role("color.interaction.text-selection.bg"));
    }
  });
  test(`${version}: prompt clear-button end space survives both entrypoints and RTL`, () => {
    for (const entrypoint of ["command-palette", "quick-switcher"]) for (const dir of ["ltr", "rtl"]) {
      const prompt = element("div", ["prompt", entrypoint], body(), { dir });
      const input = element("input", ["prompt-input"], prompt);
      const style = cascade(css, input);
      assert.equal(style.value("padding-inline-start"), "8px");
      assert.equal(style.value("padding-inline-end"), "48px");
      assert.equal(cascade(native + emitted.replace("padding-inline-start:", "padding-inline:"), input).value("padding-inline-end"), "8px", "mutation detects lost native reservation");
    }
  });
  test(`${version}: UI selection and Search hover/mobile-tap contrast limits remain explicit`, async () => {
    const readme = await readText("ports/obsidian/README.md");
    for (const state of ["hover", "mobile-tap"]) {
      const node = element("div", ["search-result-file-match", ...(state === "mobile-tap" ? [state] : [])], body(), {}, state === "hover" ? [state] : []);
      const result = cascade(css, node), contrast = pair(result.value("color"), result.value("background-color"));
      assert.equal(contrast.pass, false);
      assert.equal(contrast.display, "3.96");
    }
    for (const fg of ["color.text.default", "color.text.muted", "color.text.subtle"]) assert.equal(pair(role(fg), role("color.interaction.text-selection.bg")).pass, false);
    assert.ok(pair(role("color.interaction.text-selection.text"), role("color.interaction.text-selection.bg")).pass);
    for (const text of ["3.96:1", "below the 4.5:1", "muted/faint", "`:hover`", "`.mobile-tap`", "not a contrast waiver"]) assert.ok(readme.includes(text), text);
  });
  test(`${version}: selected tree and main/sidebar tab borders keep label geometry constant`, () => {
    for (const mobile of [false, true]) for (const dir of ["ltr", "rtl"]) {
      const root = body(mobile); root.attrs.dir = dir;
      for (const panel of ["file-explorer", "outline", "search", "bookmarks"]) {
        const parent = element("div", [panel], root);
        for (const state of [[], ["is-active"], ["is-selected"], ["is-selected", "is-active"], ["is-selected", "mobile-tap"]]) {
          const node = element("div", ["tree-item-self", ...state], parent);
          const result = cascade(css, node);
          assert.equal(result.value("border-inline-start-width"), "2px");
          assert.equal(result.value("border-inline-start-style"), "solid");
          assert.equal(result.value("border-inline-start-color"), state.length ? role("color.border.selected-indicator") : "transparent");
        }
      }
      for (const split of ["mod-root", "mod-left-split", "mod-right-split"]) for (const focused of [true, false]) {
        const parent = element("div", ["workspace-tab-header-container"], element("div", [split], body(mobile, focused)));
        for (const active of [false, true]) for (const hover of [false, true]) {
          const tab = element("div", ["workspace-tab-header", ...(active ? ["is-active"] : [])], parent, {}, hover ? ["hover"] : []);
          const result = cascade(css, tab);
          assert.equal(result.value("border-bottom-width"), "2px");
          assert.equal(result.value("border-bottom-style"), "solid");
          assert.equal(result.value("border-bottom-color"), active ? role(focused ? "color.border.selected-indicator" : "color.border.selected-indicator-inactive") : "transparent");
        }
      }
      assert.equal(cascade(native + removeRule(emitted, ".theme-dark .tree-item-self"), element("div", ["tree-item-self"], root)).value("border-inline-start-width"), undefined);
    }
  });
}
