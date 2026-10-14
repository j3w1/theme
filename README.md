# j3w1 UI Theme Spec

**True-black canvas. Near-black surfaces. Rose text. Red focus. Square components.**

`j3w1/theme` **defines** the j3w1 look: exact tokens, semantic roles,
interaction states, accessibility limits, component specifications and
portability rules. People and AI agents use it to build the same theme in
websites, apps, editors, terminals and native theme formats. It publishes:

- a design-system portal: **https://j3w1.github.io/theme/**;
- the complete static specification: **https://j3w1.github.io/theme/reference/**;
- an independently written [Vue demo](https://j3w1.github.io/theme/demo/);
- machine-readable exports for agents, the official `@j3w1/ui` web package and
  ready-made application themes.

<!-- version:start -->
Specification version **4.0.0** (release; default: approved, heritage-ansi: heritage, extended: proposed).

Use the pinned approved default profile. Pending roles in that profile use-and-report their decision IDs; this does not approve them. Proposed profiles are preview-only and blocked for delivery. Heritage profiles are historical-only. Deprecated or heritage roles are blocked for new approved-profile mappings. Consume roles within their documented scope, never primitives. Release numbering does not approve profiles or tokens.
<!-- version:end -->

Approval and consumption eligibility are separate; see the policy above and
`spec/decisions.md` D-013.

## Quick start

Pin a release tag or a full commit, never `main`, and read every file at that
same revision. Releases are tags.

**Theme an application.** Download a file from the table below. Each link is
pinned to this version's release tag, and the site serves the same file from
its **download** link. Each port's README under `ports/` gives scope, limits
and rollback; declared status and import evidence are under
[Application ports](#application-ports).

<!-- downloads:start -->
| Application | File (theme 4.0.0) | Also on the site | Install | Status |
| --- | --- | --- | --- | --- |
| ChatGPT desktop app (Appearance) | [presets.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/chatgpt/dist/presets.json) | [download](https://j3w1.github.io/theme/ports/chatgpt/presets.json) | Open ChatGPT > Settings > Appearance > Dark theme > Import and paste a preset's import string, or set the values in the preset's table by hand (see ports/chatgpt/README.md). | experimental; import evidence not verified |
| Claude Code (custom theme) | [j3w1.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/claude-code/dist/j3w1.json) | [download](https://j3w1.github.io/theme/ports/claude-code/j3w1.json) | Save as ~/.claude/themes/j3w1.json and set "theme": "custom:j3w1" in ~/.claude/settings.json; or run node ports/claude-code/install.mjs apply in a clone of this repository (see its README). | experimental; import evidence not verified |
| Codex CLI (tmTheme) | [j3w1.tmTheme](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/codex/dist/j3w1.tmTheme) | [download](https://j3w1.github.io/theme/ports/codex/j3w1.tmTheme) | Save as ~/.codex/themes/j3w1.tmTheme and set theme = "j3w1" under [tui] in ~/.codex/config.toml; or run node ports/codex/install.mjs apply in a clone of this repository (see its README). | experimental; import evidence not verified |
| Ghostty theme | [j3w1](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/ghostty/dist/j3w1) | [download](https://j3w1.github.io/theme/ports/ghostty/j3w1) | Save as ~/.config/ghostty/themes/j3w1 and add `theme = j3w1` to your Ghostty config. | experimental; import evidence not verified |
| Obsidian theme | [manifest.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/obsidian/dist/manifest.json) | [download](https://j3w1.github.io/theme/ports/obsidian/manifest.json) | Copy manifest.json and theme.css into <vault>/.obsidian/themes/j3w1/, choose the Dark base scheme, then select j3w1 under Settings → Appearance → Themes. | experimental; import evidence not verified |
| Obsidian theme | [theme.css](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/obsidian/dist/theme.css) | [download](https://j3w1.github.io/theme/ports/obsidian/theme.css) | Copy beside manifest.json in <vault>/.obsidian/themes/j3w1/; restart Obsidian after a manifest update. | experimental; import evidence not verified |
| Orca (Ghostty config import) | [config.ghostty](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/orca/dist/config.ghostty) | [download](https://j3w1.github.io/theme/ports/orca/config.ghostty) | Save as %APPDATA%\ghostty\config.ghostty (Windows) or ~/.config/ghostty/config.ghostty, then Orca → Settings → Terminal → Import from Ghostty → Apply Changes. | experimental; import evidence not verified |
| Telegram Android and Desktop | [j3w1.attheme](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/telegram/dist/j3w1.attheme) | [download](https://j3w1.github.io/theme/ports/telegram/j3w1.attheme) | File install: open in Telegram for Android (or send to Saved Messages and tap), then Apply. Cloud publication and automatic updates require the separate owner steps in the guide; the current files await a new import check. | experimental; import evidence stale |
| Telegram Android and Desktop | [j3w1.tdesktop-theme](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/telegram/dist/j3w1.tdesktop-theme) | [download](https://j3w1.github.io/theme/ports/telegram/j3w1.tdesktop-theme) | File install: open with Telegram Desktop, then Apply this theme and Keep changes. Cloud publication and automatic updates require the separate owner steps in the guide; the current files await a new import check. | experimental; import evidence stale |
| Warp theme YAML (also Orca's Import from YAML) | [j3w1.yaml](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/warp/dist/j3w1.yaml) | [download](https://j3w1.github.io/theme/ports/warp/j3w1.yaml) | Orca → Settings → Terminal Themes → Import from YAML (or save into %APPDATA%\warp\Warp\data\themes\ and use Import from Warp), then select "j3w1 theme" as the Dark Theme. Warp: save into its themes folder. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [windows-settings.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/windows-settings.json) | [download](https://j3w1.github.io/theme/ports/windows/windows-settings.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [terminal-fragment.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/terminal-fragment.json) | [download](https://j3w1.github.io/theme/ports/windows/terminal-fragment.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [terminal-theme.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/terminal-theme.json) | [download](https://j3w1.github.io/theme/ports/windows/terminal-theme.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [fancyzones-layouts.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/fancyzones-layouts.json) | [download](https://j3w1.github.io/theme/ports/windows/fancyzones-layouts.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [windows-11-taskbar-styler.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/windows-11-taskbar-styler.json) | [download](https://j3w1.github.io/theme/ports/windows/windows-11-taskbar-styler.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [windows-11-start-menu-styler.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/windows-11-start-menu-styler.json) | [download](https://j3w1.github.io/theme/ports/windows/windows-11-start-menu-styler.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [windows-11-file-explorer-styler.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/windows-11-file-explorer-styler.json) | [download](https://j3w1.github.io/theme/ports/windows/windows-11-file-explorer-styler.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [windows-11-notification-center-styler.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/windows-11-notification-center-styler.json) | [download](https://j3w1.github.io/theme/ports/windows/windows-11-notification-center-styler.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [windows-11-settings-styler.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/windows-11-settings-styler.json) | [download](https://j3w1.github.io/theme/ports/windows/windows-11-settings-styler.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-wallpaper.bmp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-wallpaper.bmp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-wallpaper.bmp) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1.theme](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1.theme) | [download](https://j3w1.github.io/theme/ports/windows/j3w1.theme) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-arrow.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-arrow.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-arrow.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-help.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-help.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-help.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-appstarting.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-appstarting.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-appstarting.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-wait.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-wait.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-wait.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-crosshair.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-crosshair.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-crosshair.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-ibeam.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-ibeam.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-ibeam.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-nwpen.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-nwpen.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-nwpen.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-no.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-no.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-no.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-sizens.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-sizens.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-sizens.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-sizewe.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-sizewe.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-sizewe.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-sizenwse.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-sizenwse.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-sizenwse.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-sizenesw.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-sizenesw.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-sizenesw.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-sizeall.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-sizeall.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-sizeall.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-uparrow.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-uparrow.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-uparrow.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-hand.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-hand.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-hand.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-pin.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-pin.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-pin.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-person.cur](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-person.cur) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-person.cur) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [runtime.cjs](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/runtime.cjs) | [download](https://j3w1.github.io/theme/ports/windows/runtime.cjs) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [install-manifest.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/install-manifest.json) | [download](https://j3w1.github.io/theme/ports/windows/install-manifest.json) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-explorer-native.wh.cpp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-explorer-native.wh.cpp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-explorer-native.wh.cpp) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-explorer-native.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-explorer-native.json) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-explorer-native.json) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-powertoys-preview.wh.cpp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-powertoys-preview.wh.cpp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-powertoys-preview.wh.cpp) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-powertoys-preview.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-powertoys-preview.json) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-powertoys-preview.json) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-calculator.wh.cpp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-calculator.wh.cpp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-calculator.wh.cpp) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-calculator.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-calculator.json) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-calculator.json) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-powertoys-markdown.wh.cpp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-powertoys-markdown.wh.cpp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-powertoys-markdown.wh.cpp) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-powertoys-markdown.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-powertoys-markdown.json) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-powertoys-markdown.json) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [markdown-theme.css](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/markdown-theme.css) | [download](https://j3w1.github.io/theme/ports/windows/markdown-theme.css) | Use the pinned Windows lifecycle installer. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-folder.ico](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-folder.ico) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-folder.ico) | Run the single pinned ports/windows/install.ps1; folder defaults are included in its saved rollback. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-folder-open.ico](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-folder-open.ico) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-folder-open.ico) | Run the single pinned ports/windows/install.ps1; folder defaults are included in its saved rollback. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-notepad-native.wh.cpp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-notepad-native.wh.cpp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-notepad-native.wh.cpp) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-notepad-native.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-notepad-native.json) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-notepad-native.json) | Use the pinned ports/windows/install.ps1 lifecycle; do not overwrite whole application settings. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-notepad-chrome.wh.cpp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-notepad-chrome.wh.cpp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-notepad-chrome.wh.cpp) | Use the single pinned ports/windows/install.ps1 lifecycle; chrome changes share its saved rollback. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-notepad-chrome.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-notepad-chrome.json) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-notepad-chrome.json) | Use the single pinned ports/windows/install.ps1 lifecycle; chrome changes share its saved rollback. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-paint-chrome.wh.cpp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-paint-chrome.wh.cpp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-paint-chrome.wh.cpp) | Use the single pinned ports/windows/install.ps1 lifecycle; chrome changes share its saved rollback. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-paint-chrome.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-paint-chrome.json) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-paint-chrome.json) | Use the single pinned ports/windows/install.ps1 lifecycle; chrome changes share its saved rollback. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-terminal-chrome.wh.cpp](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-terminal-chrome.wh.cpp) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-terminal-chrome.wh.cpp) | Use the single pinned ports/windows/install.ps1 lifecycle; chrome changes share its saved rollback. | experimental; import evidence not verified |
| Windows 11 native and Windhawk theme | [j3w1-terminal-chrome.json](https://raw.githubusercontent.com/j3w1/theme/v4.0.0/ports/windows/dist/j3w1-terminal-chrome.json) | [download](https://j3w1.github.io/theme/ports/windows/j3w1-terminal-chrome.json) | Use the single pinned ports/windows/install.ps1 lifecycle; chrome changes share its saved rollback. | experimental; import evidence not verified |
<!-- downloads:end -->

**Build a web app.** Use the official `@j3w1/ui` package: all 67 inventory
entries as native HTML, typed Custom Elements, per-component imports and
complete copy distributions. [`docs/ui-consumption.md`](docs/ui-consumption.md)
covers the package, copy and native mapping routes. For the official
implementations, read `packages/ui/dist/index.json`, then the
`contracts/<id>.json` and `examples/<id>.json` you need; the installed
`j3w1-ui kit` command prepares bounded framework, package, copy or mapping
kits. npm publication is still an owner action; until then the portal offers an
installable tarball with integrity metadata. No purchased template source or
assets are included, and `j3w1/j3w1.github.io` stays a separate downstream app.

**Use the tokens.** `exports/tokens.css` exposes every role as a CSS custom
property and `exports/tokens.resolved.json` holds the resolved values of every
profile. Consume roles, never primitives.

**Point an agent at it.** Follow [`agents/consume.md`](agents/consume.md):

1. Read `theme.json`.
2. Read `exports/theme.compact.md`.
3. Read the `exports/components/<id>.json` files you need.
4. Record `theme.lock.json` and report deviations.

`exports/llms.txt` is a discovery index for tools that look for one.

## The identity in seven values

<!-- tokens:start -->
| Role | Value | Status | Use |
| --- | --- | --- | --- |
| `color.surface.canvas` | `#000000` | approved; use | Page and terminal background. |
| `color.surface.default` | `#100c0c` | approved; use | Panels and cards. |
| `color.surface.raised` | `#160b0b` | approved; use | Sticky headers, menus, popovers; D-027 recessed it so an open list reads as depth rather than a lighter panel. |
| `color.text.default` | `#e99499` | observed; use | Interface and body text. |
| `color.text.bright` | `#ffa2a7` | observed; use | Brighter rose interface labels and explicit semantic emphasis. Bold itself inherits color; content headings use text.heading (D-033). |
| `color.text.prose` | `#e99499` | approved; use | Long-form reading and body text; rose, never an on-fill or heading shortcut (D-033). |
| `color.text.muted` | `#bd787d` | observed; use | Secondary text; the darkest colour permitted for chrome text. |
| `color.text.subtle` | `#ad7175` | approved; use | Metadata, comments, line numbers. |
| `color.border.control` | `#a3676b` | proposed; use-and-report (D-007) | Form-control boundary (4.45:1, meets the 3:1 non-text minimum). |
| `color.border.default` | `#531310` | observed; use | Decorative border (1.39:1; never the only edge of a control). |
| `color.interaction.focus.ring` | `#e53935` | observed; use | 1px dashed focus ring on controls and rows. |
| `color.interaction.selection.bg` | `#531310` | approved; use | Selected row, tab, workspace; D-027 recessed the fill, leaving the 2px indicator and the check to carry selection. |
| `color.action.primary.bg` | `#7d1310` | approved; use | Primary button fill; D-026 darkened it off color12, which stays fixed as heritage ANSI 12. |
| `color.status.danger.text` | `#f73f35` | observed; use | Danger text (5.40:1). |
| `color.status.warning.text` | `#c9973f` | approved; use | Warning text (7.54:1). |
| `color.status.success.text` | `#86a46f` | approved; use | Success text (7.13:1). |
| `color.status.info.text` | `#7e9ebb` | approved; use | Info text (7.08:1). |
<!-- tokens:end -->

Three bounded hues (amber, green, blue) exist for status, diagnostics and diffs
(decision D-001), and for opt-in syntax themes through `code.hued.*` (D-030).
They are forbidden in surfaces, chrome, buttons, links and selections. The
reference syntax highlighting stays monochrome in the default profile. Where
the palette came from, and the three profiles (`default`, `heritage-ansi`,
`extended`), are in [`spec/identity.md`](spec/identity.md).

## Read further

- **Specification:** [identity](spec/identity.md),
  [foundations](spec/foundations.md), [accessibility](spec/accessibility.md),
  [portability](spec/portability.md), the [decision log](spec/decisions.md),
  [form patterns](spec/form-patterns.md), the
  [Figma bridge](spec/figma-bridge.md) and one file per component under
  `spec/components/`.
- **Portal tools:** the
  [component workbench](https://j3w1.github.io/theme/workbench/), the
  [token usage explorer](https://j3w1.github.io/theme/tokens/),
  [standalone recipes](https://j3w1.github.io/theme/recipes/), the
  [task-kit builder](https://j3w1.github.io/theme/kit/), the
  [release comparison](https://j3w1.github.io/theme/releases/), the
  [port capability explorer](https://j3w1.github.io/theme/ports/), the
  [validation and recovery pattern](https://j3w1.github.io/theme/patterns/validation-recovery/),
  the [form builder](https://j3w1.github.io/theme/builder/) and the
  [Figma Variables bridge](https://j3w1.github.io/theme/figma/). Each page
  states its own limits; canonical specimens, normative content and reporting
  links work without JavaScript.
- **Implementation:** [`docs/ui-consumption.md`](docs/ui-consumption.md) and
  [`docs/ui-architecture.md`](docs/ui-architecture.md).
- **Ports:** [`ports/README.md`](ports/README.md) says which guide you need.
- **History:** [`CHANGELOG.md`](CHANGELOG.md), the decision log and the
  migration notes for [True Black / Rose](docs/true-black-rose-migration.md)
  and [rose typography](docs/rose-typography-migration.md).
- **Contributing:** [`AGENTS.md`](AGENTS.md); `CLAUDE.md` imports it. To change
  how the theme looks, use [design mode](docs/design-mode.md)
  (`npm run design`), a working tool, not a gate.

## Repository map

| Path | Owns |
| --- | --- |
| `theme.json` | Versions, profiles and their statuses, entry points, export map, site URL and base path, licence map |
| `tokens/` | Exact values (`primitives`), semantic roles (`semantic`), non-colour foundations, and profile overrides — DTCG 2025.10 format, supported scope declared in the manifest |
| `spec/` | Identity, foundations, accessibility, portability, the decision log, `families.json`, `contrast.json`, and one Markdown file plus one demo fragment per component |
| `agents/consume.md` | How to apply the theme elsewhere |
| `schemas/` | zod schema factories shared by the scripts and the site; `schemas/json/` is generated |
| `scripts/` | Validators and generators (`npm run validate`, `npm run generate`, `npm run check`); `scripts/lib/` is hashed into the package identities, `scripts/tooling/` holds local-tooling helpers that are not |
| `exports/` | Generated, committed: resolved tokens, semantic usage index, CSS custom properties, contrast report, coverage ledger, per-component JSON and briefs, compact and full Markdown, `llms.txt`, digests |
| `packages/ui/` | The `@j3w1/ui` package; `packages/ui/dist/` is generated |
| `site/` | The Astro source of the design-system portal, complete reference and token tools, built to `dist/` and deployed to `/theme/` by CI |
| `references/` | Pinned provenance, catalogued historical implementations, excerpts, and any reference screenshots with their provenance |
| `ports/` | One folder per app, each with a manifest, mapping, generated theme file and evidence; Orca, Claude Code and Codex also hold their installer and one guide (`ports/README.md` says which one you need) |
| `templates/` | Starting points for a port, a component and the fresh-agent consumption task |
| `tests/` | Source tests, `dist/` tests, browser tests, consumption fixtures |

## Application ports

The [capability explorer](https://j3w1.github.io/theme/ports/) and
`exports/port-capabilities.json` keep mapped, inherited, unsupported,
out-of-scope and not-implemented roles apart from import verification (D-018).
Changing targets, mappings, capabilities or artifact bytes makes import
evidence stale. `ports/README.md` describes the capability metadata and the
evidence fingerprint.

<!-- ports:start -->
| Port | Format | Declared status | Import evidence | Theme | Tested on | Supported / inherited / unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| ChatGPT desktop app (Appearance) | chatgpt-appearance | experimental | not verified | 4.0.0 | — (windows, macos) | 1 / 0 / 9 |
| Claude Code (custom theme) | claude-theme-json | experimental | not verified | 4.0.0 | — (linux, macos, windows) | 1 / 1 / 2 |
| Codex CLI (tmTheme) | codex-tmtheme | experimental | not verified | 4.0.0 | — (linux, macos) | 1 / 1 / 3 |
| Ghostty theme | ghostty-config | experimental | not verified | 4.0.0 | — (macos, linux) | 3 / 1 / 1 |
| Obsidian theme | obsidian-theme | experimental | not verified | 4.0.0 | — (any) | 3 / 1 / 2 |
| Orca (Ghostty config import) | ghostty-config | experimental | not verified | 4.0.0 | — (windows, macos, linux) | 4 / 1 / 1 |
| Telegram Android and Desktop | telegram-theme | experimental | stale | 4.0.0 | Telegram Android 12.10.6, Telegram Desktop 7.2.9 (android, windows, linux, macos) | 4 / 3 / 1 |
| Warp theme YAML (also Orca's Import from YAML) | warp-yaml | experimental | not verified | 4.0.0 | — (windows, macos, linux) | 1 / 1 / 3 |
| Windows 11 native and Windhawk theme | windows-theme | experimental | not verified | 4.0.0 | — (windows) | 4 / 1 / 1 |
<!-- ports:end -->

## Component coverage

*Specified* means the component's specification validates. *Demonstrated*
means its demo renders every declared variant on the site. *Test implemented*
means a browser test exists for it. Real outcomes are published separately in
the linked verification report, with exact scope, configuration and digests
(`spec/accessibility.md`, Verification evidence). The ledger is generated from
the sources.

<!-- coverage:start -->
| Component | Family | Priority | Specified | Demonstrated | Test implemented |
| --- | --- | --- | --- | --- | --- |
| `admin-form` | composed | R1 | yes | yes | — |
| `alert` | feedback | R1 | yes | yes | — |
| `avatar` | display | R2 | yes | yes | — |
| `badge` | display | R1 | yes | yes | — |
| `breadcrumbs` | navigation | R1 | yes | yes | — |
| `button-group` | actions | R2 | yes | yes | — |
| `button` | actions | R1 | yes | yes | yes |
| `card` | display | R1 | yes | yes | — |
| `chart` | display | R2 | yes | yes | — |
| `checkbox` | forms-basic | R1 | yes | yes | yes |
| `chip` | display | R1 | yes | yes | — |
| `code-editor` | developer | R1 | yes | yes | — |
| `combobox` | forms-advanced | R1 | yes | yes | — |
| `command-palette` | navigation | R2 | yes | yes | — |
| `compact-dashboard` | composed | R2 | yes | yes | — |
| `data-table` | display | R1 | yes | yes | — |
| `date-picker` | forms-advanced | R1 | yes | yes | — |
| `description-list` | display | R2 | yes | yes | — |
| `diagnostics` | developer | R1 | yes | yes | — |
| `dialog` | feedback | R1 | yes | yes | yes |
| `diff-view` | developer | R1 | yes | yes | — |
| `disclosure` | navigation | R2 | yes | yes | — |
| `drawer` | feedback | R1 | yes | yes | — |
| `editor-search` | developer | R2 | yes | yes | — |
| `empty-state` | feedback | R1 | yes | yes | — |
| `error-state` | feedback | R2 | yes | yes | — |
| `field` | forms-basic | R1 | yes | yes | — |
| `fieldset` | forms-basic | R1 | yes | yes | — |
| `file-browser` | composed | R2 | yes | yes | — |
| `file-input` | forms-advanced | R1 | yes | yes | — |
| `filterable-table` | composed | R1 | yes | yes | — |
| `form-builder` | forms-advanced | L | yes | yes | yes |
| `i3-window-frame` | composed | R1 | yes | yes | — |
| `icon-button` | actions | R1 | yes | yes | — |
| `kbd` | display | R2 | yes | yes | — |
| `link` | actions | R1 | yes | yes | yes |
| `list` | display | R1 | yes | yes | — |
| `loading-indicator` | feedback | R1 | yes | yes | — |
| `menu` | navigation | R1 | yes | yes | yes |
| `multiselect` | forms-advanced | R2 | yes | yes | — |
| `number-field` | forms-basic | R1 | yes | yes | — |
| `pagination` | navigation | R1 | yes | yes | — |
| `popover` | feedback | R2 | yes | yes | — |
| `progress` | feedback | R1 | yes | yes | — |
| `radio-group` | forms-basic | R1 | yes | yes | yes |
| `range` | forms-basic | R2 | yes | yes | — |
| `repeater` | forms-advanced | R2 | yes | yes | — |
| `search-field` | forms-basic | R1 | yes | yes | — |
| `segmented-control` | actions | R2 | yes | yes | — |
| `select` | forms-basic | R1 | yes | yes | yes |
| `settings-panel` | composed | R1 | yes | yes | — |
| `sidebar-nav` | navigation | R1 | yes | yes | — |
| `skeleton` | feedback | R2 | yes | yes | — |
| `skip-link` | navigation | R1 | yes | yes | — |
| `switch` | forms-basic | R1 | yes | yes | — |
| `table` | display | R1 | yes | yes | yes |
| `tabs` | navigation | R1 | yes | yes | yes |
| `terminal` | developer | R1 | yes | yes | — |
| `text-field` | forms-basic | R1 | yes | yes | yes |
| `textarea` | forms-basic | R1 | yes | yes | — |
| `time-picker` | forms-advanced | R1 | yes | yes | — |
| `timeline` | display | R2 | yes | yes | — |
| `toast` | feedback | R1 | yes | yes | — |
| `toolbar` | navigation | R1 | yes | yes | — |
| `tooltip` | feedback | R1 | yes | yes | — |
| `tree` | navigation | R2 | yes | yes | — |
| `wizard` | forms-advanced | R1 | yes | yes | — |
<!-- coverage:end -->

## Versioning

Semantic versioning over the contract, not the code.

- **Major:** removing or renaming a role, changing an approved value or its
  meaning, removing a component or state, an incompatible export or lock
  schema.
- **Minor:** new roles, components, states, variants or profiles; promoting
  proposed to approved.
- **Patch:** prose, generation, test and site fixes, evidence updates.

Every global appearance change gets a changelog entry and a downstream impact
note. Releases are tags; consumers pin them.

## Licence

MIT for code, tokens, schemas, scripts and generated JSON/CSS; CC BY 4.0 for
specification prose and specimens; reference screenshots all rights reserved
(D-004). See [`LICENSE.md`](LICENSE.md). No fonts are distributed; the
recommended family is named in `theme.json`.
