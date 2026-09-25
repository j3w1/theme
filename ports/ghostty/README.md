# j3w1 theme for Ghostty

Status: experimental until a real import into the recorded version is
evidenced. See `port.json` for scope, `mapping.json` for every native key and
`capabilities.json` for the reason behind each role that is not mapped.

`dist/j3w1` is a Ghostty theme file generated from `mapping.json` and the
default profile by `npm run generate`; never edit it by hand. No real Ghostty
import is recorded yet.

## What it themes, and what it does not

- Supported: background (`color.terminal.bg`), foreground, cursor colour and
  cursor text, selection background and foreground, palette 0–15, and
  `split-divider-color` (`color.border.divider`, use-and-report under D-008).
- Inherited: font family, size and cell height stay in your own config. The
  theme's font is `SauceCodePro NFM` at 13 px. A pixel line height has no exact
  `adjust-cell-height` equivalent.
- Unsupported: light mode. The theme has no light profile.

## Install

1. Download `j3w1` from the Downloads table in the repository README.
2. Save it as `~/.config/ghostty/themes/j3w1`.
3. Add `theme = j3w1` to your Ghostty config and reload it.

Orca on macOS or Linux follows `theme = j3w1` when you click **Import from
Ghostty**. On Windows, use the Orca port (`ports/orca/`) instead: Orca there has
no Ghostty themes folder to look in.

## Verify

Open the fixture set (`templates/port/CHECKLIST.md`) and compare against the
terminal specimen on the site. Record the Ghostty version, OS, font, scaling,
profile, fixture revision and artifact digest in `evidence/`.

## Roll back

Remove the `theme = j3w1` line (or point it at your previous theme) and delete
`~/.config/ghostty/themes/j3w1`.
