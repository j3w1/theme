<!-- Generated from docs/ui-consumption.md by npm run generate; edit that file. -->

# Consuming j3w1 components

Use `@j3w1/ui` in web applications that support Custom Elements. Its native
children stay real HTML, so labels, form ownership, validation, fieldsets and
reset keep browser semantics. The canonical design contract stays in `tokens/`
and `spec/`.

An empty `<j3w1-text-field>` does not invent a label or an input. Start from the
complete maintained markup on the component's page.

## Install and pin

- **1.0.0** makes True Black / Rose the default; it is a major upgrade from
  0.1.0. Read `docs/true-black-rose-migration.md` before you replace old tokens.
- **2.0.0** is also major: D-029 lifts the dim terminal slots and two code syntax
  reds, and D-030 adds opt-in `code.hued.*` syntax roles. Component behaviour is
  unchanged. Read the 2.0.0 changelog entry before you upgrade from 1.x.
- **3.0.0** is major too: D-032 makes terminal slot 6 coral `#ff7a66` and gives
  the prompt its own background role. Component behaviour is unchanged. Read
  the 3.0.0 changelog entry before you upgrade.

Keep the exact package version and your package-manager lockfile in source
control.

```sh
npm install --save-exact @j3w1/ui@3.0.0
```

That command needs npm publication, which is an owner release action. Before
publication:

1. Download the release tarball.
2. Check it against its published digest.
3. Install the local file:

```sh
npm install --save-exact ./j3w1-ui-3.0.0.tgz
```

The repository builds this same artifact with `npm run ui:build` and
`npm run ui:pack`. Never use a branch URL in place of a release pin. Do not
assume the package is published just because this guide exists.

## Load one component

**Choices.** Version 1.1.0 adds theme-owned single and multiple choices (D-025).

- Use `j3w1-select` when the open list must use j3w1 colors. A bare native
  select is only the no-JavaScript fallback.
- The component keeps its native select for FormData, required validation,
  defaults, disabled fieldsets and reset. The visible control is a select-only
  combobox or a multiselectable listbox.
- Use the separate `j3w1-combobox` when users need to type and filter
  suggestions.

For existing application markup, the supported enhancement applies the same
renderer without moving the native controls or changing their names:

```js
import '@j3w1/ui/tokens.css';
import '@j3w1/ui/styles/controls.css';
import { enhanceControls } from '@j3w1/ui/enhance/choice';

const controls = enhanceControls(document.querySelector('#application'));
// On application unmount:
controls.destroy();
```

- It watches inserted and removed controls inside that root only.
- Vue and other frameworks keep owning their native selects and option values;
  normal value bindings and change handlers keep working.
- In Vue, call it after mount and destroy it in `onBeforeUnmount`. The official
  demo does this.
- Complete `select` copy bundles include the same renderer. Do not hand-roll a
  different dropdown in each application.

Single-choice keys: Enter/Space or arrows open; arrows and Home/End move; typing
finds an option; Enter/Space commits; Escape/Tab close.

Multiple-choice keys: arrows move; Space or click toggles; Shift with arrows
selects a range; Ctrl/Command+A selects or clears all enabled options.

The open list, selected fill, check mark, focus boundary and error message are
theme-rendered. The visible control gets the original accessible label and
descriptions.

**Dates and times.** Date and time inputs also get a themed editor.

- Dates: explicit YYYY-MM-DD entry and a calendar. Arrows navigate, Home/End
  move within a week, PageUp/Down change month, Enter/Space choose, Escape
  closes. The calendar follows the native min, max and step constraints.
- Times: HH:MM or HH:MM:SS entry, plus buttons that apply the native step;
  step="any" disables stepping.
- Labels, native constraints, defaults, reset and read-only/disabled states stay
  connected to the original inputs, which remain the no-JavaScript fallback.
- If an engine exposes date/time inputs as text, the enhancement supplies ISO
  parsing, range/step validation and time stepping itself. The same form value,
  visible validation and reset contract applies there.

**Other controls.** Within the enhanced root, the stylesheet also themes
ordinary checkbox, radio, range and file-button chrome, and removes browser
number spinners; use the Number field's explicit step controls instead.
Browser-owned file and system dialogs stay host UI.

**Testing.** The native form element stays queryable for data integration, but
browser tests should use the visible combobox/listbox: Playwright `selectOption` on
the hidden native select does not test the rendered menu. Click real options and
use the keyboard.

**One component.**

```js
import '@j3w1/ui/tokens.css';
import '@j3w1/ui/styles/text-field.css';
import '@j3w1/ui/register/text-field';
```

1. Copy the maintained text-field markup from its component page.
2. Load token CSS once in your app.

The registration entry loads the nested registrations it needs, and the
stylesheet includes its full style dependency closure.
`@j3w1/ui/register` and `@j3w1/ui/styles.css` load the entire catalogue; use them
for a complete gallery and prefer per-component imports in ordinary apps.

Class imports such as `@j3w1/ui/components/text-field` have no registration side
effects and are safe during SSR; register in the browser. Importing the same
registration module again is safe. A foreign class already registered under the
same name is rejected. Use one package version per document.

## Vue 3 JavaScript SFCs

1. Tell the Vue compiler that `j3w1-*` tags are Custom Elements in your Vite
   config:

   ```js
   import { defineConfig } from 'vite';
   import vue from '@vitejs/plugin-vue';
   export default defineConfig({
     plugins: [vue({ template: { compilerOptions: {
       isCustomElement: tag => tag.startsWith('j3w1-'),
     } } })],
   });
   ```

2. Import registration in your browser entry or in the SFC that uses the
   component.
3. Put the maintained native markup in the template.

Bindings:

- Native forms: `@submit.prevent` and `new FormData(event.target)`.
- Custom events: `@j3w1-change="onChange"`; read the payload from `event.detail`.
- Objects and arrays: `.prop`, for example `:data.prop="series"`.
- A ref exposes the typed custom-element methods after mount.
- When Vue owns the value, use the native input's `v-model`. Do not assume a
  custom wrapper implements Vue's component `modelValue` convention.

The full JavaScript SFC demo in `apps/demo` is an independently written package
consumer.

## React, Astro and plain HTML

**React 19** supports Custom Elements.

- Use native JSX children, and `defaultValue` for an uncontrolled native input.
- Use a ref for complex properties and imperative APIs.
- `addEventListener('j3w1-change', handler)` works consistently; remove the
  listener in the effect cleanup.
- A native form's `onSubmit` receives the real form.

**Astro** renders the maintained markup statically.

- Import the CSS in frontmatter.
- Import registration in a browser `<script>`. Never register Custom Elements in
  server frontmatter.
- Essential labels and content are visible before JavaScript runs. Complex
  interactive controls document their JavaScript limits.

**Plain HTML.** Use the copy distribution's `index.html`, or serve the package's
`dist` directory and load its relative ESM registration module with
`<script type="module">`. Serve it over HTTP; loading module files from a `file:`
URL is not supported. A complete copy bundle has no bare runtime imports and no
dependency on the documentation website.

## Attributes, properties and events

- Boolean attributes work by presence: `disabled="false"` still disables a
  control. Remove the attribute or set `.disabled = false`.
- Attributes hold strings. Arrays, objects and native `File` instances go in
  properties. The generated API table and declarations list each component's
  properties and methods.
- Native input attributes set defaults. Setting `.value` or `.checked` changes
  the current state without faking a user event. Native `form.reset()` restores
  defaults.
- A radio group's value names the checked native option. Multiple selections
  expose arrays where the API declares them.
- Native input and change events keep their original behavior.
- Documented `j3w1-*` events are bubbling, composed, cancelable `CustomEvent`s
  with a structured `detail`. Canceling one controls a default action only when
  its API says so; canceling a reporting event does not undo a value change.

## Forms and validation

- Keep the native control's `name`, value, label and form relationships intact.
- `FormData` includes successful native controls; unchecked checkboxes and
  disabled fields are left out. A switch uses its documented native hidden value.
- Required, min/max, pattern and custom validity are your choices; the package
  infers no business validation. Use `checkValidity()` or `reportValidity()`, and
  keep the canonical error-summary and focus-recovery rules for multi-field forms.
- File input exposes the selected local files and never uploads them.
- Authentication, persistence, authorization, network retries and domain policy
  belong to your app. The demo labels its local simulations. Developer views
  never run code.

## Composition, lifecycle and styling

The package uses light DOM, so native semantics and static content survive.
Native children are the composition surface; there are no hidden Shadow DOM
slots to guess.

- Keep the canonical class names and ARIA relationships from the maintained
  examples.
- Give every instance unique IDs, and update all `for`, `aria-*` and fragment
  references together.
- Disconnecting an instance removes its listeners, timers and open overlays;
  reconnecting reattaches behavior.
- If your framework replaces the native children of a connected instance, call
  `refresh()` after the DOM update. Do not let a framework and a widget both
  own or reorder the same child collection.

Density and fonts:

- Set `data-density="compact"` or `data-density="comfortable"` on the document
  or a containing element. Tokens include both modes.
- The default font stack falls back to locally installed monospace fonts. No
  font binaries are bundled; get any optional font from its publisher under its
  own license.

Styling:

- Component CSS is scoped to its custom tag. Load it after broad application
  resets, and avoid later selectors that restyle every button or input.
- Customize only with the canonical semantic token variables, layout and
  documented classes. New literal colors or changed design meaning are a
  deviation, not an official theme variant.
- Keep focus, selection, contrast and forced-colors behavior. Scope any
  deliberate host override and record it in your integration.

## Copy a complete bundle

```sh
npx --package=@j3w1/ui@3.0.0 j3w1-ui copy dialog --out ./vendor/j3w1/dialog
npx --package=@j3w1/ui@3.0.0 j3w1-ui kit --components text-field,button,dialog --out ./vendor/j3w1/task
```

- Installed from a tarball: run the installed `j3w1-ui` binary instead of npx.
- The CLI checks all source bytes before it writes. It rejects unknown components
  and symlink destinations, and refuses existing destinations.
- Keep `element.html`, `component.css`, `tokens.css`, the whole `runtime/`
  closure, the manifest and the licence notices together.
- Multi-component kits put each complete bundle in its own named directory. Do
  not flatten files whose names collide.

The package manifest keeps declared implementation apart from run evidence.
`index.json` is the compact discovery index; `contracts/<id>.json` and
`examples/<id>.json` keep small tasks bounded. Canonical exports keep
eligibility, decision disclosures and the mapping/lock workflow, so existing
canonical-mapping integrations keep working. Record official package use
separately, with its exact package identity.

## Troubleshooting and upgrades

- Unknown custom tag: load browser registration and configure the Vue compiler.
- Unstyled control: load tokens and the matching component stylesheet; keep the
  example's native children and canonical classes.
- Missing form value: check the native control's name, checked/disabled state
  and actual owning form. Do not add a duplicate hidden field to a native input.
- Stale behavior after changing children: call `refresh()` after your
  framework's DOM update and keep IDs unique.
- Registration conflict: remove the second implementation or version; never
  silently replace a class already in the Custom Elements registry.
- Copy integrity failure: fetch the pinned artifact again and check its digest.
  Never delete or bypass integrity checks.

To upgrade:

1. Install into a clean fixture.
2. Review the migration notes and changed contracts.
3. Exercise your real form and keyboard flows.
4. Update the package lock and your integration record together.

Browser results apply only to the tested artifact and environment. Manual
screen-reader and physical-device testing are separate evidence, never inferred
from automated checks.
