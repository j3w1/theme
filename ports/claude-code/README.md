# j3w1 theme for Claude Code

A Claude Code custom theme, `custom:j3w1`, built only from approved roles:
rose reading text, a restrained red accent, semantic agent hues, and distinct
status, diff and usage colours (D-041). Status: experimental (no recorded import evidence).

Ordinary agent text follows the shared rose UI/terminal palette; white is
reserved for document headings, exceptional highlights and contrast-critical
roles. Semantic code, status and diff colours remain distinct.

Needs Node 24, Git, a clone of this repository and Claude Code 2.1.281 or
later. Claude Code also uses the terminal's sixteen colours (see Limits), so
install a terminal theme too, for example [`../orca/`](../orca/README.md).

## Install

<!-- install:start -->
Release v3.0.0 (commit `f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6`).

1. In your clone of this repository (`~/dev/theme` on the CE devbox; if you have none, run `git clone https://github.com/j3w1/theme.git ~/dev/theme` and `cd` into it), paste:

   ```sh
   git pull --ff-only --tags
   node ports/claude-code/install.mjs apply --revision f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6
   ```

2. Restart Claude Code sessions that were already running (new sessions pick the theme up by themselves).
3. Check it:

   ```sh
   node ports/claude-code/install.mjs test
   ```
<!-- install:end -->

The installer behaves as described in
[Claude Code and Codex installers](../README.md#claude-code-and-codex-installers):
`--dry-run`, `update --version`, `restore`, backups and state folder.

**Without the installer:** save `dist/j3w1.json` as `~/.claude/themes/j3w1.json`
and set `"theme": "custom:j3w1"` in `~/.claude/settings.json`.

## Update

`node ports/claude-code/install.mjs apply` after `git pull`, or
`node ports/claude-code/install.mjs update --version v3.0.0` for a release tag;
it prints what changes, role by role.

## Restore

```sh
node ports/claude-code/install.mjs restore
```

Puts `"theme"` back to what it was (or removes it) and deletes the theme file
if the installer created it. Claude Code only.

## What it changes

- `~/.claude/themes/j3w1.json`: created or replaced (base `dark-ansi`, every
  role observed in Claude Code 2.1.281 to 2.1.283, with the shared diff-word
  behavior also inspected in 2.1.301).
- `"theme": "custom:j3w1"` in `~/.claude/settings.json`. Only that key changes;
  every other byte, the byte-order mark and the line endings are kept.
- It follows `CLAUDE_CONFIG_DIR` and `HOME`, so inside an agent session it acts
  on that session's configuration; `--claude-config-dir` picks another one.
- Dialog borders use the strong red text role because Claude shares their
  colour with inline-code text; this keeps both uses readable (D-041).

**Restart once.** Sessions already running when the themes folder was first
created need one restart; after that, changes load live.

## Limits

Claude Code's own; `test` prints them.

- Highlighted code, links (slot 12) and file previews use terminal colours.
  Line-level `+` and `-` markers may inherit ANSI slots or the row foreground,
  depending on Claude's renderer; there is no independent line-marker token.
- **Edit-summary `+N` / `-N` counts:** Claude Code 2.1.303 shares
  `diffAddedWord` / `diffRemovedWord` between summary foreground and word
  background. Dedicated `diff.*.shared-word` roles use muted green and red:
  each remains above 3:1 on black and beneath rose text. These reduce the glaring fills without returning
  the summary to nearly black. Both uses cannot reach 4.5:1 with the same
  colour; the best balanced ratio is about 3.03:1. This is a documented host
  compromise, not a generic text waiver or a syntax-wide contrast pass.
  There is no independent summary or word-text foreground setting.
- Dimmed/rejected diff rows retain their added/removed line tint; those theme
  keys are backgrounds, not disabled foreground text.
- The selected item in a picker changes its text colour only; there is no
  selection fill.
- Subagent names follow the semantic terminal hues. Normal/bright pairs may
  share values; the displayed name remains the identity channel.
- Mouse selection keeps each span's own colour on the selection background;
  some colours fall below 4.5:1 there.
- Inline code uses Claude Code's permission colour (the dialog border);
  both use strong red so the shared colour meets ordinary text contrast.
- The shell-mode input border is the same as the normal one; the `!` marker
  shows the mode.

## Files

- `install.mjs`: the installer (shared code in `scripts/lib/host-install/`).
- `host.json`: which Claude Code theme key takes which role, and the limits
  above.
- `dist/j3w1.json`: the theme file, generated from `host.json` by
  `npm run generate`; do not edit it.
- `port.json`, `mapping.json`, `capabilities.json`: the port's scope, every
  native key, and the reason for each role that is not mapped.

The [Claude Code color reference](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme)
documents the word-background keys. The shared summary-foreground use was
inspected in the installed 2.1.301 renderer; this is source inspection, not
installed visual acceptance.
