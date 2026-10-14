# j3w1 theme for Ghostty

Status: experimental; no real Ghostty import is recorded. `port.json` holds
the scope, `mapping.json` every native key, `capabilities.json` the reason for
each unmapped role. `dist/j3w1` is generated from `mapping.json` and the
default profile by `npm run generate`; never edit it by hand.

## What it themes, and what it does not

- Supported: background (`color.terminal.bg`), foreground, cursor colour and
  cursor text, selection background and foreground, palette 0–15, and
  `split-divider-color` (`color.border.divider`, use-and-report under D-008).
- Inherited: font family, size and cell height stay in your own config (the
  theme's font is `SauceCodePro NFM` at 13 px; a pixel line height has no exact
  `adjust-cell-height` equivalent).
- Unsupported: light mode; the theme has no light profile.

## Install

1. Download `j3w1` from the Downloads table in the repository README.
2. Save it as `~/.config/ghostty/themes/j3w1`.
3. Add `theme = j3w1` to your Ghostty config and reload it.

Orca on macOS or Linux follows `theme = j3w1` on **Import from Ghostty**. On
Windows, where Orca has no Ghostty themes folder, use the Orca port
(`ports/orca/`).

## Verify

Open the fixture set (`templates/port/CHECKLIST.md`) and compare against the
terminal specimen on the site. Record the Ghostty version, OS, font, scaling,
profile, fixture revision and artifact digest in `evidence/`.

## Roll back

Remove the `theme = j3w1` line (or point it at your previous theme) and delete
`~/.config/ghostty/themes/j3w1`.
