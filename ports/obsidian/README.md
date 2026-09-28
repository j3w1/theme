# j3w1 for Obsidian

Experimental, dark-only theme for Obsidian **1.13.4+** (including the declared
minimum supported by 1.13.7). A Windows 1.13.7 import and visible rendering
were **user-reported**; repository real-import verification, including manual
keyboard, zoom and screen-reader checks, is not recorded. The port is not
`verified`.

## Install on Windows (recommended helper)

1. Completely close Obsidian. Find your vault folder (for example,
   `C:\Users\you\Documents\MyVault`). It must already contain `.obsidian`.
   The installer only changes the theme's two files. Two separate Windows file
   replacements cannot be truly atomic, so keep Obsidian closed through an
   installation or update.
2. In PowerShell, edit `$vault` to your own existing vault path. Download the
   [reviewed installer](https://j3w1.github.io/theme/ports/obsidian/install.ps1)
   to your Downloads folder, **inspect it before running it**, then execute it:

   ```powershell
   $vault = 'C:\Users\you\Documents\MyVault' # edit this path
   $installer = Join-Path $HOME 'Downloads\j3w1-install.ps1'
   Invoke-WebRequest 'https://j3w1.github.io/theme/ports/obsidian/install.ps1' -OutFile $installer -ErrorAction Stop
   Get-Content -LiteralPath $installer # review the entire downloaded script before continuing
   & $installer -VaultPath $vault
   ```

   Do not pipe a remote download into execution or bypass your execution policy.
   If your policy blocks a local script, use the pasteable alternative below.
   The helper downloads both live files into a temporary directory, validates
   their name/version pair, backs up an existing pair, restores it if replacement
   fails, and removes temporary files on success. If restoration itself fails,
   it prints the location of recovery copies rather than deleting them.

## Alternative: paste PowerShell commands

This route does not back up or verify the matching versions; it is **less
failure-safe** than the helper. Completely close Obsidian first, use one
download session for **both** files, and replace the two together. Edit `$vault`
and paste the block into PowerShell:

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

If either download fails, do not start Obsidian with a potentially mixed pair;
restore both saved previous files or rerun both downloads together. The live
files can also be inspected separately:
[manifest.json](https://j3w1.github.io/theme/ports/obsidian/manifest.json) and
[theme.css](https://j3w1.github.io/theme/ports/obsidian/theme.css).

## Enable and verify

The final folder should contain exactly the two native theme artifacts:

```text
<vault>\.obsidian\themes\j3w1\
  manifest.json
  theme.css
```

Check both files exist and have nonzero `Length` with
`Get-Item -LiteralPath $manifest,$css` (set `$theme` and those two paths as
shown above if you used the helper). Restart Obsidian, set
**Settings → Appearance → Base color scheme → Dark**, then select **j3w1**
under **Themes**. Light mode is not supported. Expect black note backgrounds,
rose ordinary Reading View and editor text, near-white headings, inline title
and bold, and rose/dark-red interface surfaces. Links and italic retain their
own colors. The installed manifest declares `minAppVersion: 1.13.4`.

## Update or roll back

To update, close Obsidian, save **both** installed files together outside the
active theme directory, then rerun the reviewed helper with the same vault path
(or both pasteable downloads). Verify both files, restart Obsidian and reselect
the theme if necessary. Do not mix versions; the live URLs may change as the
site publishes a new release.

To roll back an update, close Obsidian, restore **both** saved files together
to `j3w1`, then restart. To stop using the theme, select Default or your
previous theme under Appearance; after closing Obsidian, you may delete only
the `j3w1` theme folder if no longer needed. No vault notes, settings or
plugins should be removed. See [implementation and verification limits](IMPLEMENTATION.md)
for the compatibility audit, selector ledger and real-import protocol.
