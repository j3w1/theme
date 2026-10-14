# j3w1 for Obsidian

Experimental, dark-only theme for Obsidian, minimum app version **1.13.4**.
The hooks it relies on are source-audited on 1.13.4 and 1.13.7 only; later
versions are not audited or imported. Windows and Android use the same two
files, `manifest.json` and `theme.css`. A Windows 1.13.7 import and visible
rendering were **user-reported**; no Android import is recorded. The port is
not `verified`: see [implementation and verification limits](IMPLEMENTATION.md).

## Install on Windows (recommended helper)

1. Completely close Obsidian and keep it closed until the install or update
   finishes. Find your vault folder (for example,
   `C:\Users\you\Documents\MyVault`); it must already contain `.obsidian`.
2. In PowerShell, edit `$vault`, download the
   [reviewed installer](https://j3w1.github.io/theme/ports/obsidian/install.ps1),
   **inspect it before running it**, then execute it:

   ```powershell
   $vault = 'C:\Users\you\Documents\MyVault' # edit this path
   $installer = Join-Path $HOME 'Downloads\j3w1-install.ps1'
   Invoke-WebRequest 'https://j3w1.github.io/theme/ports/obsidian/install.ps1' -OutFile $installer -ErrorAction Stop
   Get-Content -LiteralPath $installer # review the entire downloaded script before continuing
   & $installer -VaultPath $vault
   ```

   Do not pipe a remote download into execution or bypass your execution policy;
   if the policy blocks a local script, use the pasteable alternative below.
   The helper changes only the theme's two files, validates the pair and
   restores the previous pair if replacement fails.

## Local candidate or offline installation

For a reviewed local checkout or a separately obtained release archive, pass
the directory holding its generated `manifest.json` and `theme.css`:

```powershell
& ./ports/obsidian/install.ps1 -VaultPath $vault -SourcePath ./ports/obsidian/dist
```

This makes no network request and does not establish the source's provenance.
Use both files from the same reviewed revision.

## Alternative: paste PowerShell commands

This route neither backs up nor checks matching versions; it is **less
failure-safe** than the helper. Close Obsidian, edit `$vault` and paste:

```powershell
$ErrorActionPreference = 'Stop'
$vault = 'C:\Users\you\Documents\MyVault' # edit this path
if (-not (Test-Path -LiteralPath (Join-Path $vault '.obsidian') -PathType Container)) {
    throw 'Vault configuration folder does not exist; check $vault.'
}
$theme = Join-Path $vault '.obsidian\themes\j3w1'
$manifest = Join-Path $theme 'manifest.json'
$css = Join-Path $theme 'theme.css'
New-Item -ItemType Directory -Path $theme -Force -ErrorAction Stop | Out-Null
Invoke-WebRequest 'https://j3w1.github.io/theme/ports/obsidian/manifest.json' -OutFile $manifest -ErrorAction Stop
Invoke-WebRequest 'https://j3w1.github.io/theme/ports/obsidian/theme.css' -OutFile $css -ErrorAction Stop
if (-not (Test-Path -LiteralPath $manifest -PathType Leaf) -or
    -not (Test-Path -LiteralPath $css -PathType Leaf)) { throw 'Theme pair is incomplete.' }
if ((Get-Item -LiteralPath $manifest).Length -eq 0 -or
    (Get-Item -LiteralPath $css).Length -eq 0) { throw 'A downloaded theme file is empty.' }
Get-ChildItem -LiteralPath $theme
```

If either download fails, do not start Obsidian with a possibly mixed pair:
restore both saved files or rerun both downloads together. The live files:
[manifest.json](https://j3w1.github.io/theme/ports/obsidian/manifest.json),
[theme.css](https://j3w1.github.io/theme/ports/obsidian/theme.css).

## Install on Android (Termux helper)

Only vaults in Obsidian's **device storage** are supported; Termux cannot reach
a vault in app storage. Read the [Android guide](ANDROID.md) first: storage,
the vault path, a manual fallback without Termux, and rollback. Completely
close Obsidian, including from recent apps, and any app that syncs the vault.
In Termux, edit `vault`, download the
[reviewed installer](https://j3w1.github.io/theme/ports/obsidian/install-android.sh),
**inspect it before running it**, then execute it:

```sh
termux-setup-storage # once: allow Termux to use shared storage
pkg install curl jq # once
vault="$HOME/storage/shared/Documents/MyVault" # edit this path
curl -fL --proto '=https' https://j3w1.github.io/theme/ports/obsidian/install-android.sh -o "$HOME/j3w1-install-android.sh"
cat "$HOME/j3w1-install-android.sh" # review the entire downloaded script before continuing
sh "$HOME/j3w1-install-android.sh" --vault "$vault"
```

Do not pipe a remote download into a shell.

## Enable and verify

The theme folder should hold exactly the two files (Windows shows `\`):

```text
<vault>/.obsidian/themes/j3w1/
  manifest.json
  theme.css
```

On Windows, check both have nonzero `Length` with
`Get-Item -LiteralPath $manifest,$css` (set `$theme`, `$manifest` and `$css` as
in the pasteable block if you used the helper); in Termux, use
`ls -l "$vault/.obsidian/themes/j3w1"`. Restart Obsidian, set
**Settings → Appearance → Base color scheme → Dark**, then select **j3w1**
under **Themes**. Light mode is not supported. Expect black note backgrounds,
rose body text, near-white headings and inline title, bold in its surrounding
color, and rose/dark-red interface surfaces.

## Update or roll back

To update, close Obsidian, save **both** installed files together outside the
theme folder (each helper keeps its own backup only until the new pair is in
place), rerun your platform's helper with the same vault (or both pasteable
downloads), then restart Obsidian and reselect the theme if necessary. Do not
mix versions; the live URLs change when the site publishes a release.

To roll back an update, close Obsidian, restore **both** saved files together
to `j3w1`, then restart. To stop using the theme, select Default or your
previous theme under Appearance; after closing Obsidian you may delete only the
`j3w1` folder. No notes, settings or plugins are changed.
