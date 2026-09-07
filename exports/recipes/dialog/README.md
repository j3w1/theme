# dialog standalone reference

j3w1 theme 0.1.0. Markup adapted from j3w1 UI Theme Spec, https://github.com/j3w1/theme, CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. Changes: scoped instance IDs and documentation-only content removed. CSS and generator: MIT; see LICENSE.md.

Version 0.1.0; profile default; source digest sha256-H5K2i6tnubQb6mBDV35hqd7qFHPGoIShzhuNGffJmYU=. Pin the supplying commit and verify manifest source/file digests; the version alone does not identify a revision.

Open example.html directly, without Astro, network assets or a build step. two-instances.html demonstrates independent IDs. For integration, include tokens.css, foundation.css and component.css in that order, then markup.html. Keep .j3w1-recipe and data-density on the wrapper. The source viewer can make a fresh instance prefix; use a unique prefix for every copy and rewrite all ID references together.

## Behavior and limits

- Visual-only: the native dialog is open in normal flow with a simulated backdrop.
- No showModal, focus trap, Escape handling, close actions or focus return is supplied. The host owns the complete modal lifecycle and positioning.
- Removing open hides the dialog but does not remove its backdrop wrapper; this is not a complete closed-state implementation.

Supported visual states: default, open, hover, focus-visible, reduced-motion. No JavaScript behavior module is supplied. No font binaries or third-party assets are bundled.

## Transformations

- Use the default maintained demo fragment before documentation rendering.
- Remove forced-state selectors and documentation notes; retain actual native pseudo-classes.
- Scope CSS to .j3w1-recipe; rewrite IDs and ID references together for each instance.
- Convert rem lengths to multiples of font.size.ui-md, preserving the canonical 13px root geometry without changing the host root.

## Policy

Pending roles retain their use-and-report decision IDs in manifest.json. Alias dependencies, including inspection-only primitives, support the role values; they are not recommendations to consume primitives directly.
