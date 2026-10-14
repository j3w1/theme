# Consuming j3w1 components

`@j3w1/ui` serves web applications that support Custom Elements. Native
children stay real HTML, so labels, form ownership, validation, fieldsets and
reset keep browser semantics. The design contract stays in `tokens/` and
`spec/`. An empty `<j3w1-text-field>` invents no label or input: start from
the maintained markup on the component's page.

## Install and pin

Keep the exact package version and your lockfile in source control.

<!-- ui-install:start -->
```sh
npm install --save-exact @j3w1/ui@4.0.0
```
<!-- ui-install:end -->

That needs npm publication, an owner release action; do not assume it
happened. Until then, download the release tarball, check it against its
published digest and install the file:

<!-- ui-tarball:start -->
```sh
npm install --save-exact ./j3w1-ui-4.0.0.tgz
```
<!-- ui-tarball:end -->

`npm run ui:build` and `npm run ui:pack` build the same artifact here. Never
pin a branch URL.

## Import and register

```js
import '@j3w1/ui/tokens.css';
import '@j3w1/ui/styles/text-field.css';
import '@j3w1/ui/register/text-field';
```

Load the token CSS once, then copy the component's maintained markup. A
registration entry loads the nested registrations it needs, and a stylesheet
carries its full style closure. `@j3w1/ui/register` and `@j3w1/ui/styles.css`
load the whole catalogue, for a gallery; ordinary apps import per component.

- Class imports such as `@j3w1/ui/components/text-field` have no registration
  side effects and are safe during SSR; register in the browser.
- Registering the same module twice is safe; a foreign class already
  registered under the same name is rejected. Use one package version per
  document.
- Compact is the default density (D-038); set `data-density="comfortable"` on
  the document or a containing element to opt in to the larger mode.
- No font binaries are bundled; the stack falls back to locally installed
  monospace fonts.
- Component CSS is scoped to its tag: load it after broad resets and avoid
  later selectors that restyle every button or input. Customise only through
  the semantic token variables, layout and documented classes; a new literal
  colour is a deviation to record, not a theme variant. Keep focus,
  selection, contrast and forced-colours behaviour.

### Themed choices, dates and native controls

`j3w1-select` renders its open list in theme colours (D-025) as a select-only
combobox or a multiselectable listbox; its native select stays the source of
FormData, validation, defaults, disabled fieldsets and reset, and the
no-JavaScript fallback. Use `j3w1-combobox` when users type to filter. To
enhance existing application markup without moving native controls or
changing their names:

```js
import '@j3w1/ui/tokens.css';
import '@j3w1/ui/styles/controls.css';
import { enhanceControls } from '@j3w1/ui/enhance/choice';

const controls = enhanceControls(document.querySelector('#application'));
// On application unmount:
controls.destroy();
```

- It watches controls inserted into or removed from that root only.
  Frameworks keep owning their native selects,
  value bindings and change handlers; in Vue, call it after mount and destroy
  it in `onBeforeUnmount`. Complete `select` copy bundles include the same
  renderer; do not hand-roll another dropdown.
- Date and time inputs get a themed editor (ISO entry, a calendar, step
  buttons) bound to the native constraints, defaults and reset; the original
  inputs stay the no-JavaScript fallback. Where an engine exposes them as
  text, the enhancement validates ISO values, range and step itself. Keys are
  on each component page.
- Checkbox, radio, range and file-button chrome is themed; number spinners are
  removed in favour of the Number field's step controls. Browser-owned file
  and system dialogs stay host UI.
- Test the visible combobox or listbox: Playwright `selectOption` on the
  hidden native select does not exercise the rendered menu.

## Frameworks

**Vue 3.** Declare `j3w1-*` tags as Custom Elements in the Vite config, import
registration in the browser entry or the SFC, and put the maintained native
markup in the template:

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue({ template: { compilerOptions: {
    isCustomElement: tag => tag.startsWith('j3w1-'),
  } } })],
});
```

Submit with `@submit.prevent` and `new FormData(event.target)`; listen with
`@j3w1-change="onChange"` and read `event.detail`; pass objects and arrays as
properties (`:data.prop="series"`); bind values with the native input's
`v-model`, not a component `modelValue`. A ref exposes the element's methods
after mount. `apps/demo` is an independent package consumer.

**React 19.** Use native JSX children and `defaultValue` for an uncontrolled
input, a ref for complex properties and methods, and
`addEventListener('j3w1-change', handler)` removed in the effect cleanup. A
native form's `onSubmit` receives the real form.

**Astro.** Import CSS in frontmatter and registration in a browser `<script>`,
never in server frontmatter.

**Plain HTML.** Use the copy bundle's `index.html`, or serve the package's
`dist` directory over HTTP and load its relative ESM registration module with
`<script type="module">`; `file:` URLs are not supported. A complete copy
bundle has no bare runtime imports and does not depend on this website.

## Attributes, events and forms

- Boolean attributes work by presence: `disabled="false"` still disables.
  Remove the attribute or set `.disabled = false`.
- Arrays, objects and `File` instances go in properties; the generated API
  table lists them.
- Setting `.value` or `.checked` changes state without faking a user event;
  native `form.reset()` restores the defaults.
- Native input and change events behave as usual. Documented `j3w1-*` events
  are bubbling, composed, cancelable `CustomEvent`s with a structured
  `detail`; cancelling one stops a default action only where its API says so,
  and never undoes a value change it reports.
- Keep each native control's `name`, label and form relationships. `FormData`
  holds successful native controls only. Validation rules, uploads,
  persistence and authorisation are your app's; use `checkValidity()` or
  `reportValidity()`.
- Light DOM: native children are the composition surface. Give every instance
  unique IDs and update each `for`, `aria-*` and fragment reference with
  them. Call `refresh()` after your framework replaces the children of a
  connected instance, and never let a framework and a widget both own the
  same children. Disconnecting removes listeners, timers and open overlays;
  reconnecting reattaches them.

## Copy a complete bundle

<!-- ui-copy:start -->
```sh
npx --package=@j3w1/ui@4.0.0 j3w1-ui copy dialog --out ./vendor/j3w1/dialog
npx --package=@j3w1/ui@4.0.0 j3w1-ui kit --components text-field,button,dialog --out ./vendor/j3w1/task
```
<!-- ui-copy:end -->

From a tarball install, run the installed `j3w1-ui` binary instead of npx.
The CLI checks every source byte before writing and refuses unknown
components, symlinks and existing destinations. Keep `element.html`,
`component.css`, `tokens.css`, the whole `runtime/` closure, the manifest and
the licence notices together; a kit gives each bundle its own directory.
`index.json` is the discovery index, and `contracts/<id>.json` and
`examples/<id>.json` keep small tasks bounded.

## Upgrade

1. Install into a clean fixture and read the notes below and the changelog.
2. Exercise your real form and keyboard flows.
3. Update the lockfile and your integration record together.

- **4.0.0** (D-033): prose and interface text are rose; content headings use
  `color.text.heading`; bold inherits its colour. Replace heading uses of
  `text.prose` with `text.heading` and drop colour rules attached only to
  bold (`docs/rose-typography-migration.md`).
- **3.0.0** (D-032): terminal slot 6 is coral `#ff7a66`, the prompt gets its
  own background role and bright rose `#ffa2a7` text, and
  `color.primitive.ansi-readable.6` is removed.
- **2.0.0** (D-029, D-030): the dim terminal slots and two code syntax reds are
  lifted; opt-in `code.hued.*` syntax roles are added.
- **1.0.0** (D-023): True Black / Rose becomes the default; read
  `docs/true-black-rose-migration.md` before replacing 0.1.0 tokens.

Component behaviour did not change in 2.0.0 or 3.0.0. If something breaks:
an unknown tag needs browser registration (and the Vue compiler setting); an
unstyled control needs tokens and its stylesheet; a missing form value means
checking the native control's name, state and owning form, never adding a
hidden duplicate; a registration conflict means removing the second version;
a copy integrity failure means fetching the pinned artifact again, never
bypassing the check. Browser results cover only the tested artifact and
environment; manual screen-reader and device testing are separate evidence.
