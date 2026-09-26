# ChatGPT

True-black ChatGPT with the j3w1 red and rose. Two presets:

- **j3w1 Signature**: the strongest j3w1 look. Recommended.
- **j3w1 Reading**: a calmer rose for long reading.

This port targets the **ChatGPT desktop app**, Settings > Appearance. It has
custom accent, background and foreground colours, a contrast slider, font
sizes and theme import. What you see depends on your platform, account, plan,
app version and rollout. In a web browser, many accounts still show only the
basic appearance controls (light, dark, system and a list of accent colours).
Then only the Mode, and an accent close to the one below, apply.

Status: **experimental**. The import strings follow the public description of
ChatGPT's `codex-theme-v1` format. They count as verified only once imported
into a real ChatGPT build and checked against the table. The tables work on
their own.

## Install

1. Open ChatGPT > Settings > Appearance.
2. Either paste a preset's import string (Dark theme > Import), or set each
   value in its table by hand.
3. Set the two font sizes by hand. The import string carries colours and
   contrast only.

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

Every colour and size is a theme role, resolved from the approved `default`
profile when the port is generated (`src/presets.json` names the roles).

- Signature's foreground is `color.text.bright`.
- Reading's foreground is `color.text.default`.
- The accent is `color.interaction.focus.ring`.
- The background is `color.surface.canvas`.
- The sizes are `font.size.reading` and `font.size.code`.
- In the import string, the diff and skill colours are
  `color.status.success.text`, `color.status.danger.text` and
  `color.text.accent`.

Contrast (46 and 52), diff markers (+/-), reduce motion and the base theme
are ChatGPT settings, not theme roles. They are calibration chosen in real
use. Diff markers stay on because j3w1 never shows a change by colour alone.

ChatGPT has one foreground for all text. j3w1 has a ladder (prose, bright,
default, muted, subtle), so each preset picks one step. That is a choice for
this app only; the theme's own roles do not change.

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

Settings > Appearance: choose another theme, or reset the colours and contrast
to the defaults shown there. Nothing is installed on disk.

## Files

- `src/presets.json`: the source: roles, calibration, preset names.
- `dist/presets.json`: generated. Both presets with every setting, where each
  value comes from, and the import strings.
- `port.json`, `mapping.json`, `capabilities.json`: the port contract.
