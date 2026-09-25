# j3w1 theme for Orca

Status: experimental until a real import into the recorded version is
evidenced. See `port.json` for scope, `mapping.json` for every native key and
`capabilities.json` for the reason behind each role that is not mapped.

`dist/j3w1-theme.yaml` is generated from `mapping.json` and the default profile
by `npm run generate`; never edit it by hand. It uses the Warp theme format
that Orca's **Import from YAML** reads. This port targets Orca only and makes no
claim about Warp itself.

## What it themes, and what it does not

- Supported: the dark-mode terminal background (`color.terminal.bg`),
  foreground, cursor and all sixteen ANSI slots, normal and bright.
- Inherited from Orca: terminal font family, size, line height and letter
  spacing. Set `SauceCodePro NFM`, 13px, if you want the theme's typography.
- Unsupported:
  - Selection colours: Orca's YAML import drops them.
  - The pane divider: a separate Orca setting (see Install, step 4).
  - Light mode: the theme has no light profile.
- Out of scope: Orca's window, sidebar and settings chrome.

## Prerequisites

Orca 1.4.209 or later, on any platform Orca runs on.

## Install

1. Download `j3w1-theme.yaml` from the Downloads table in the repository README.
   Use the link for the theme version you want, never a branch.
2. In Orca, open **Settings → Terminal Themes → Import from YAML** and choose
   the file.
3. With **Theme Mode** on Dark, select **j3w1 theme** under Dark Theme. Importing
   adds an entry and overwrites no built-in theme.
4. Optional: set **Dark Divider Color** to `#2b0e0d` (`color.border.divider`).

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

In **Settings → Terminal Themes**, select the dark theme you used before and
remove the imported **j3w1 theme** entry. If you changed **Dark Divider Color**,
reset it.
