# j3w1 theme for Claude Code

A Claude Code custom theme, `custom:j3w1`, built only from approved roles:
rose text, the red accent, your messages on the selected-row red, status,
diff and usage colours. Everything for Claude Code is in this folder. Status:
experimental (no recorded import evidence yet).

You need Node 24, Git and a clone of this repository, and Claude Code 2.1.281
or later. Claude Code also uses the terminal's sixteen colours (see Limits),
so install the terminal theme too, for example [`../orca/`](../orca/README.md).

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

The installer writes the theme file and one setting, and prints what it did.
Add `--dry-run` to see the plan first.

**Without the installer:** save `dist/j3w1.json` as `~/.claude/themes/j3w1.json`
and set `"theme": "custom:j3w1"` in `~/.claude/settings.json`. This route has no
backup or restore.

## Update

After `git pull`, `node ports/claude-code/install.mjs apply` installs the
commit your clone is on. To install a release by its tag instead, run
`node ports/claude-code/install.mjs update --version` with the tag, for example
`v3.0.0`; it prints what changes, role by role. Tags before v3.0.0 are refused.
Values always come from git objects at that commit, never from files you have
edited.

## Restore

```sh
node ports/claude-code/install.mjs restore
```

It puts `"theme"` back to what it was (or removes it) and deletes the theme
file if the installer created it. It restores Claude Code only; Codex has its
own installer.

- `--latest` undoes only the newest change; `--backup <name>` undoes that one
  backup. `--dry-run` shows the plan.
- If a value changed after the installer set it, restore warns, puts back the
  earlier value and keeps the replaced one in its own backup.
- If a restore stops partway, it says which command finishes it.

## What it changes

- `~/.claude/themes/j3w1.json`: created or replaced (base `dark-ansi`, every
  role Claude Code 2.1.281 to 2.1.283 has, so nothing falls back to a default).
- `"theme": "custom:j3w1"` in `~/.claude/settings.json`. Only that key changes;
  every other byte, the byte-order mark and the line endings are kept.
- It follows `CLAUDE_CONFIG_DIR` and `HOME`, so inside an agent session it acts
  on that session's configuration. `--claude-config-dir` picks another one.
- Backups and records go to `${XDG_STATE_HOME:-~/.local/state}/j3w1-theme`,
  shared with the Codex installer. If only the terminal kit's old folder
  (`…/j3w1-theme/devbox`) holds backups, the installer keeps using it and says
  so, so restore still brings back your original settings. Set `J3W1_THEME_STATE_DIR` or pass
  `--state-dir` where that folder is not writable (on the CE devbox,
  `~/.local/state` takes only registered tool folders). The older
  `J3W1_TERMINAL_KIT_STATE_DIR` still works, with a warning. If the state
  folder is not writable, nothing is changed.
- `color.border.overlay` (dialog borders) is a use-and-report role under D-008;
  every run says so.

Before writing anything it plans every change and checks each edited file
with a real parse. Each file is read again just before its write; if another
program changed it, that file is planned again once, and if it changes again
the run stops. The export must match `exports/digests.json` from the same
commit. `test` checks the commit that is installed, even after your clone
moves on, and says when the clone is ahead.

**Restart once.** Claude Code sessions that were already running when the
themes folder was first created need one restart. After that, changes load
live.

## Limits

These are Claude Code's limits; `test` prints them.

- Highlighted code, links (slot 12), diff + and - markers and file previews
  use fixed terminal colours. No theme reaches them; the terminal theme
  decides how they look.
- Word-level diff changes can only be a background, so they keep the line
  tint instead of the theme's underline.
- The selected item in a picker changes its text colour only; there is no
  selection fill.
- Subagent names get seven different colours for eight names (cyan and pink
  share one), because the theme has no extra hues for text.
- Mouse selection keeps each span's own colour on the selection background;
  some colours fall below 4.5:1 there.
- Inline code uses Claude Code's permission colour (the dialog border).
- The shell-mode input border is the same as the normal one; the `!` marker
  shows the mode.

## Files

- `install.mjs`: the installer. Its code is shared with the Codex installer in
  `scripts/lib/host-install/`.
- `host.json`: which Claude Code theme key takes which role, and the limits
  above.
- `dist/j3w1.json`: the theme file, generated from `host.json` by
  `npm run generate`; do not edit it.
- `port.json`, `mapping.json`, `capabilities.json`: the port's scope, every
  native key, and the reason for each role that is not mapped.

Tests: `tests/host-install.test.js`. To change what Claude Code shows, change
the specification through a `proposed` entry in `spec/decisions.md`; pointing
`host.json` at a different role is a specification change too.
