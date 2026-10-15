# ChatGPT

True-black ChatGPT with the j3w1 red and rose. Two presets:

- **j3w1 Signature**: the strongest j3w1 look. Recommended.
- **j3w1 Reading**: a calmer rose for long reading.

This port targets the **ChatGPT desktop app**, Settings > Appearance (custom
accent, background and foreground, a contrast slider, font sizes, theme
import). What you see depends on your platform, account, plan, app version and
rollout. Many web-browser accounts show only light, dark, system and a list of
accents; then only the Mode and the nearest accent apply.

Status: **experimental**. The import strings follow the public description of
ChatGPT's `codex-theme-v1` format; the code theme id `chatgpt` behind the
Theme row is a guess. The strings count as verified only once imported into a
real ChatGPT build and checked against the table; the tables work on their
own.

## Install

1. Open ChatGPT > Settings > Appearance. If you have a custom theme you want
   to keep, copy it first (Export, if your build shows it) or note its values.
2. Either paste a preset's import string (Dark theme > Import), or set each
   value in its table by hand.
3. The import string sets the colours, contrast and opaque windows, and
   resets the UI and code font to the default. Set the two font sizes, reduce
   motion, one mode and diff markers by hand.

<!-- presets:start -->
### j3w1 Signature (recommended)

Strongest j3w1 identity: bright rose text on true black.

| Setting | Value |
| --- | --- |
| Mode | Dark |
| Theme | ChatGPT |
| Accent | `#e53935` |
| Background | `#000000` |
| Foreground | `#ffa2a7` |
| UI font size | 15 px |
| Code font size | 13 px |
| Reduce motion | System |
| Separate light and dark | Off |
| Contrast | 46 |
| Diff markers | +/- |
| Opaque windows | On (translucent sidebar off) |

Import string (Settings > Appearance > Dark theme > Import):

```text
codex-theme-v1:{"codeThemeId":"chatgpt","theme":{"accent":"#e53935","contrast":46,"fonts":{"code":null,"ui":null},"ink":"#ffa2a7","opaqueWindows":true,"semanticColors":{"diffAdded":"#86a46f","diffRemoved":"#f73f35","skill":"#e53935"},"surface":"#000000"},"variant":"dark"}
```

### j3w1 Reading

Calmer rose for long reading sessions.

| Setting | Value |
| --- | --- |
| Mode | Dark |
| Theme | ChatGPT |
| Accent | `#e53935` |
| Background | `#000000` |
| Foreground | `#e99499` |
| UI font size | 15 px |
| Code font size | 13 px |
| Reduce motion | System |
| Separate light and dark | Off |
| Contrast | 52 |
| Diff markers | +/- |
| Opaque windows | On (translucent sidebar off) |

Import string (Settings > Appearance > Dark theme > Import):

```text
codex-theme-v1:{"codeThemeId":"chatgpt","theme":{"accent":"#e53935","contrast":52,"fonts":{"code":null,"ui":null},"ink":"#e99499","opaqueWindows":true,"semanticColors":{"diffAdded":"#86a46f","diffRemoved":"#f73f35","skill":"#e53935"},"surface":"#000000"},"variant":"dark"}
```
<!-- presets:end -->

## Tune it

Start with Signature. If long reading feels too bright, change only the
Foreground to Reading's value and the Contrast to 52. Avoid pushing the
foreground toward white: the rose text is a large part of the j3w1 look.

## Where the values come from

Every colour and size is a theme role from the approved `default` profile,
named in `src/presets.json`: foreground `color.text.bright` (Signature) or
`color.text.default` (Reading), accent `color.interaction.focus.ring`,
background `color.surface.canvas`, sizes `font.size.reading` and
`font.size.code`; in the import string, diff and skill colours
`color.status.success.text`, `color.status.danger.text` and
`color.text.accent`.

Contrast, diff markers, reduce motion and the base theme are ChatGPT settings
calibrated in real use, not theme roles. Diff markers stay on because j3w1
never shows a change by colour alone. ChatGPT has one foreground for all text,
so each preset picks one step of the j3w1 text ladder, for this app only.

## Limits

ChatGPT cannot express these parts of j3w1, and the port does not claim them:

- zero-radius corners and the dashed focus ring;
- separate surface levels (only one background);
- separate text roles (only one foreground);
- border colours;
- the theme's monospace font;
- status colours other than diff added, diff removed and skill;
- hover, pressed and selected colours (ChatGPT derives them from the accent).

Some parts of ChatGPT keep their own colours whatever the accent is.

## Undo

Settings > Appearance: import the theme you copied before, or choose another
theme and set back every row of the table you changed (colours, contrast,
font sizes, reduce motion, one mode, diff markers, opaque windows). Nothing
is installed on disk.

## Files

- `src/presets.json`: the source: roles, calibration, preset names.
- `evidence/<build>.codex-theme.txt`: a theme string ChatGPT itself exported,
  with `# build:` and `# date:` lines; record one when you verify an import.
  Generation then checks the port still emits the newest one's format and
  stops if ChatGPT changed it.
- `dist/presets.json`: generated; both presets with every setting, each
  value's source, and the import strings.
- `port.json`, `mapping.json`, `capabilities.json`: the port contract.
