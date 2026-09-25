# j3w1 theme for Orca

Status: experimental until a real import into the recorded version is
evidenced. See `port.json` for scope, `mapping.json` for every native key and
`capabilities.json` for the reason behind each role that is not mapped.

`dist/config.ghostty` is generated from `mapping.json` and the default profile
by `npm run generate`; never edit it by hand. It is written in Ghostty's config
format because Orca's **Import from Ghostty** is the Orca import that carries
the whole terminal look. That covers colours, selection, the pane divider and
the font. It reads the file directly, with no time limit.

## What it themes, and what it does not

- Supported, written as Orca terminal settings:
  - Terminal background (`color.terminal.bg`), foreground, cursor and cursor text.
  - Selection background and text.
  - All sixteen ANSI slots.
  - The pane divider (`color.border.divider`, use-and-report under D-008),
    applied to both of Orca's divider colours.
  - Terminal font family `SauceCodePro NFM` and size `13` px.
- Inherited from Orca: line height and letter spacing. Ghostty's
  `adjust-cell-height` is relative to the font's own cell height, so a pixel
  line height has no exact conversion.
- Unsupported: light mode. Orca stores these colours as overrides that apply
  whichever terminal theme is selected, so they stay dark in both modes.
- Out of scope: Orca's window, sidebar and settings chrome.

## Prerequisites

- Orca 1.4.209 or later, on Windows, macOS or Linux.
- The `SauceCodePro NFM` font, from the Nerd Fonts SauceCodePro release, if you
  want the theme's typography. Otherwise pick another font in Orca after
  importing.

## Install on Windows

1. Download `config.ghostty` from the Downloads table in the repository README
   (use the link for the theme version you want, never a branch).
2. Open `%APPDATA%` in Explorer (type it in the address bar). Create a folder
   named `ghostty` if there isn't one, and save the file there as
   `%APPDATA%\ghostty\config.ghostty`. If that folder already holds a
   `config.ghostty` or `config`, back it up first: Orca merges every Ghostty
   config it finds.
3. In Orca, open **Settings → Terminal** and click **Import from Ghostty**.
   Review the listed changes and click **Apply Changes**.

On macOS or Linux, save the file as `~/.config/ghostty/config.ghostty` instead.
Don't overwrite a real Ghostty config there; add the lines to it, or use the
`ghostty` port's theme file.

The Warp-format YAML in `ports/warp/` also imports through Orca's **Import from
YAML**. That route carries only the terminal colours, and Orca gives each file
one second to parse, counting the parser's start-up. If it reports "took too long
to parse", retry, or use this port.

## Verify

Open the fixture set (`templates/port/CHECKLIST.md`) in an Orca terminal and
compare it with the terminal specimen on the site. Record the Orca version, OS,
font family and size, scaling, profile, fixture revision and artifact digest
in `evidence/`. Promotion to `verified` requires the following:

- a real-import record under `evidence/`, validated by
  `schemas/json/port-import-evidence.schema.json` and bound to the current
  `portSubject`
- the Orca version added to `testedVersions`

A parse check is not an import.

## Roll back

In **Settings → Terminal**, choose **Reset all color overrides**. Then set the
font family, font size and divider colours back to your previous values.
Remove or rename `%APPDATA%\ghostty\config.ghostty` so a later Ghostty import
does not apply it again.
