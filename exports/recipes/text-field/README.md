# text-field standalone reference

j3w1 theme 1.0.0. Markup adapted from j3w1 UI Theme Spec, https://github.com/j3w1/theme, CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. Changes: scoped instance IDs and documentation-only content removed. CSS and generator: MIT; see LICENSE.md.

Version 1.0.0; profile default; source digest sha256-kKAkOT34XyEqtVpsWSRgvf6Zl0hJQ10jimgu9r2Tytc=. Pin the supplying commit and verify manifest source/file digests; the version alone does not identify a revision.

Open example.html directly, without Astro, network assets or a build step. two-instances.html demonstrates independent IDs. For integration, include tokens.css, foundation.css and component.css in that order, then markup.html. Keep .j3w1-recipe and data-density on the wrapper. The source viewer can make a fresh instance prefix; use a unique prefix for every copy and rewrite all ID references together.

## Behavior and limits

- Native text editing only; validation messages and aria-invalid are managed by the host.
- The default text variant is packaged. Password reveal, search clearing and number steppers are not implemented.

Supported visual states: default, hover, focus-visible, disabled, read-only, required, invalid, loading. No JavaScript behavior module is supplied. No font binaries or third-party assets are bundled.

## Transformations

- Use the default maintained demo fragment before documentation rendering.
- Remove forced-state selectors and documentation notes; retain actual native pseudo-classes.
- Scope CSS to .j3w1-recipe; rewrite IDs and ID references together for each instance.
- Convert rem lengths to multiples of font.size.ui-md, preserving the canonical 13px root geometry without changing the host root.

## Policy

Pending roles retain their use-and-report decision IDs in manifest.json. Alias dependencies, including inspection-only primitives, support the role values; they are not recommendations to consume primitives directly.
