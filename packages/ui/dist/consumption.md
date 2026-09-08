# Consuming j3w1 components

Use `@j3w1/ui` for web applications with Custom Elements support. Its native
children remain real HTML: labels, form ownership, validation, fieldsets and
reset retain browser semantics. The canonical design contract stays in
`tokens/` and `spec/`. An empty `<j3w1-text-field>` does not invent a label or an
input; start with the complete maintained markup on its component page.

## Install and pin

The 1.0.0 release introduces True Black / Rose as the default and is a major
upgrade from 0.1.0. Review `docs/true-black-rose-migration.md` before replacing old tokens.
Keep the exact package version and your package-manager lockfile in source control.

```sh
npm install --save-exact @j3w1/ui@1.0.0
```

That command requires npm publication, which is an owner release action. Before
publication, download the release tarball, verify its published digest and install
the local file instead:

```sh
npm install --save-exact ./j3w1-ui-1.0.0.tgz
```

The repository prepares this same artifact with `npm run ui:build` and
`npm run ui:pack`. Do not substitute an arbitrary branch URL for a release pin.
Do not assume a package is published merely because this documentation exists.

## Load one component

```js
import '@j3w1/ui/tokens.css';
import '@j3w1/ui/styles/text-field.css';
import '@j3w1/ui/register/text-field';
```

Copy the maintained text-field markup from its component page. The registration
entry also loads any nested component registrations it needs. Its stylesheet
includes its complete style dependency closure. Load token CSS once in your app.
`@j3w1/ui/register` and `@j3w1/ui/styles.css` load the entire catalogue and are
appropriate for a complete gallery; prefer per-component imports in ordinary apps.

Class imports such as `@j3w1/ui/components/text-field` have no registration side
effects and can be imported during SSR. Register in the browser. Importing the
same registration module repeatedly is safe; a foreign class already registered
under the same name is rejected. Use one package version per document.

## Vue 3 JavaScript SFCs

Tell the Vue compiler that `j3w1-*` tags are Custom Elements in your Vite config:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue({ template: { compilerOptions: {
    isCustomElement: tag => tag.startsWith('j3w1-'),
  } } })],
});
```

Import registration in your browser entry or the SFC that uses the component.
Put the maintained native markup in the template. Handle native forms with
`@submit.prevent` and `new FormData(event.target)`. Listen to custom events with
`@j3w1-change="onChange"`; read the payload from `event.detail`. Use `.prop` for
object/array bindings such as `:data.prop="series"`. A ref exposes the typed
custom-element methods after mount. Use the native input's `v-model` when Vue
owns the value; do not assume a custom wrapper implements Vue's component
`modelValue` convention. The full JavaScript SFC demo in `apps/demo` is an
independently authored package consumer.

## React, Astro and plain HTML

React 19 supports Custom Elements. Use native JSX children, `defaultValue` for an
uncontrolled native input, and a ref for complex properties and imperative APIs.
`addEventListener('j3w1-change', handler)` works consistently; remove the listener
in the effect cleanup. A native form's `onSubmit` receives the real form.

Astro renders the maintained markup statically. Import the CSS in frontmatter;
import registration in a browser `<script>`. Do not register Custom Elements
inside server frontmatter. Essential labels and content remain visible before
JavaScript runs. Complex interactive controls document their JavaScript limits.

For plain HTML, use the copy distribution's `index.html`, or serve the package's
`dist` directory and load its relative ESM registration module with
`<script type="module">`. Serve it over HTTP; opening module files with a `file:`
URL is not a supported module-loading workflow. There are no bare runtime imports
in a complete copy bundle and no dependency on the documentation website.

## Attributes, properties and events

Boolean attributes are presence-based: `disabled="false"` still disables a
control. Remove the attribute or set `.disabled = false`. Attributes hold strings;
arrays, objects and native `File` instances belong in properties. The generated
API table and declarations define each component's available properties/methods.

Native input attributes establish defaults. Assigning the `.value` or `.checked`
property changes current state without fabricating a user event. Native
`form.reset()` restores defaults. A radio group's value identifies the checked
native option. Multiple selections expose arrays where the API declares them.

Native input/change events retain their original behavior. Documented
`j3w1-*` events are bubbling, composed, cancelable `CustomEvent`s with structured
`detail`. Only events whose API explicitly describes a cancelable default action
control that action; canceling a reporting event does not undo a value change.

## Forms and validation

Keep the native control's `name`, value, label and form relationships intact.
`FormData` includes successful native controls; unchecked checkboxes and disabled
fields are excluded. A switch uses its documented native hidden value. Required,
min/max, pattern and custom validity are host choices; the package does not infer
business validation. Use `checkValidity()` or `reportValidity()` and preserve
the canonical error-summary/focus recovery rules for multi-field forms.

File input exposes selected local files and never uploads them. Authentication,
persistence, authorization, network retries and domain policy belong to your app.
The demo clearly labels local simulations. Developer views never execute code.

## Composition, lifecycle and styling

The package uses light DOM so native semantics and static content survive. Native
children are its composition surface; there are no hidden Shadow DOM slots to
guess. Keep canonical class names and ARIA relationships from the maintained
examples. Give every instance unique IDs and update all `for`, `aria-*` and
fragment references together.

Disconnecting an instance removes listeners, timers and open overlays. Reconnecting
reattaches behavior. If your framework replaces the native children of an already
connected instance, call `refresh()` after the DOM update. Avoid letting both a
framework and a widget independently own/reorder the same child collection.

Set `data-density="compact"` or `data-density="comfortable"` on the document or
a containing element. Tokens include both density modes. The default font stack
falls back to locally available monospace fonts. Font binaries are not bundled;
obtain any optional font from its publisher under its own license.

Component CSS is scoped to its custom tag. Load it after broad application resets;
avoid later selectors that indiscriminately restyle all buttons or inputs. Allowed
customization uses canonical semantic token variables, layout and documented
classes. New literal colors or changed design meaning are a deviation, not an
official theme variant. Preserve focus, selection, contrast and forced-colors
behavior. Scope an intentional host override and record it in your integration.

## Copy a complete bundle

```sh
npx --package=@j3w1/ui@1.0.0 j3w1-ui copy dialog --out ./vendor/j3w1/dialog
npx --package=@j3w1/ui@1.0.0 j3w1-ui kit --components text-field,button,dialog --out ./vendor/j3w1/task
```

When installed from a tarball, use the installed `j3w1-ui` binary instead of asking
npx to fetch npm. The CLI verifies all source bytes before creating output, rejects
unknown components and symlink destinations, and refuses existing destinations.
Keep `element.html`, `component.css`, `tokens.css`, the whole `runtime/` closure,
manifest and licence notices together. Multi-component kits put each complete
bundle in a named directory; do not flatten files with colliding names.

The package manifest separates declared implementation from run evidence.
`index.json` is the compact discovery index. `contracts/<id>.json` and
`examples/<id>.json` keep small tasks bounded. Canonical exports retain eligibility,
decision disclosures and the existing mapping/lock workflow. Existing integrations
using canonical mapping exports continue to work; official package consumption
must record its exact package identity separately.

## Troubleshooting and upgrades

- Unknown custom tag: load browser registration and configure the Vue compiler.
- Unstyled control: load tokens and the matching component stylesheet; preserve
  the example's native children and canonical classes.
- Missing form value: inspect the native control's name, checked/disabled state
  and actual owning form. Do not add a duplicate hidden field to a native input.
- Stale behavior after changing children: call `refresh()` after your framework's
  DOM update and keep IDs unique.
- Registration conflict: remove the second implementation/version; do not silently
  replace a class already in the Custom Elements registry.
- Copy integrity failure: fetch the pinned artifact again and verify its digest.
  Do not delete or bypass integrity checks.

For an upgrade, install into a clean fixture, review the migration and changed
contracts, exercise your actual form/keyboard flows, then update the package lock
and integration record together. Browser results are specific to the tested
artifact and environment. Manual screen-reader and physical-device testing are
separate evidence, never inferred from automated checks.
