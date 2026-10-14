# j3w1 theme for Warp (and Orca's Import from YAML)

Status: experimental; no real Warp import is recorded. `port.json` holds the
scope, `mapping.json` every native key, `capabilities.json` the reason for each
unmapped role. `dist/j3w1.yaml` is generated from `mapping.json` and the
default profile by `npm run generate`; never edit it by hand. It uses Warp's
custom-theme format, which Orca's **Import from YAML** and **Import from Warp**
also read, and has been checked against Orca 1.4.209's parser.

## What it themes, and what it does not

- Supported: terminal background (`color.terminal.bg`), foreground, cursor,
  accent (`color.text.accent`) and all sixteen ANSI slots. `details: darker` is
  derived from the background's luminance.
- Inherited: fonts are the application's own setting.
- Unsupported:
  - Selection and the pane divider: the format has no keys for them. The Orca
    port carries both.
  - Light mode: the theme has no light profile.
- Orca reads the background, foreground, cursor and the ANSI slots. It uses
  `accent` only when `cursor` is missing.

## Install in Orca

1. Download `j3w1.yaml` from the Downloads table in the repository README.
2. Either:
   - Go to **Settings → Terminal Themes → Import from YAML → Choose File**,
     pick the file and click **Import Themes**, or
   - On Windows, save it into `%APPDATA%\warp\Warp\data\themes\` (create the
     folders if needed) and click **Import from Warp**.
3. With **Theme Mode** on Dark, select **j3w1 theme** under Dark Theme.

Orca gives each file one second to parse, including starting its parser, so a
busy machine can report "Theme file took too long to parse" for any file.
Retry, or use the Orca port (`ports/orca/`), which has no time limit.

## Install in Warp

Save `j3w1.yaml` into Warp's themes folder (`~/.warp/themes/` on macOS;
`~/.local/share/warp-terminal/themes/` on Linux; `%APPDATA%\warp\Warp\data\themes\`
on Windows). Then choose it under Settings → Appearance → Themes.

## Verify

Open the fixture set (`templates/port/CHECKLIST.md`) and compare against the
terminal specimen on the site. Record the application version, OS, font,
scaling, profile, fixture revision and artifact digest in `evidence/`.

## Roll back

Orca: select your previous Dark Theme and remove the imported **j3w1 theme**.
Warp: select another theme and delete `j3w1.yaml` from its themes folder.
