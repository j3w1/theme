# j3w1 for Obsidian on Android

Android uses the same theme as desktop: the same `manifest.json` and
`theme.css`, installed into the vault's own theme folder. Only the way the
files get there differs. **No Android import of this port is recorded yet.**
The helper below is tested in Linux shells (bash and dash), not on a device.
Status, the Windows route and the implementation notes are in the
[README](README.md).

## Where your vault lives

Obsidian for Android can keep a vault in one of two places:

- **Device storage**: shared storage that other apps can reach, for example
  `Documents/MyVault` on the phone. Obsidian recommends this option, and it
  is the only one these instructions support.
- **App storage**: Obsidian's private folder. Other apps, including Termux and
  most file managers, cannot reach it, so neither the helper nor the manual
  steps below work there.

The vault folder is the one that holds your notes and a hidden `.obsidian`
folder. After `termux-setup-storage`, Termux sees shared storage at
`~/storage/shared`, the same place as `/storage/emulated/0`. A vault at
`Documents/MyVault` on the phone is therefore
`$HOME/storage/shared/Documents/MyVault` in Termux.

## Before you start

1. Install Termux, open it and run `termux-setup-storage` once. Allow the
   storage permission when Android asks; this creates `~/storage/shared`.
2. Install the two tools the helper needs: `pkg install curl jq`.
3. Completely close Obsidian: leave the app and swipe it away from the recent
   apps list. Keep it closed until the helper finishes.
4. Pause any app that syncs the vault folder while you install.

## Install with the helper

Edit `vault` to your own existing vault path. Download the
[reviewed installer](https://j3w1.github.io/theme/ports/obsidian/install-android.sh),
**read the whole script before running it**, then execute it:

```sh
vault="$HOME/storage/shared/Documents/MyVault" # edit this path
curl -fL --proto '=https' https://j3w1.github.io/theme/ports/obsidian/install-android.sh -o "$HOME/j3w1-install-android.sh"
cat "$HOME/j3w1-install-android.sh" # review the entire downloaded script before continuing
sh "$HOME/j3w1-install-android.sh" --vault "$vault"
```

Do not pipe a download straight into a shell. The helper works in this order:

1. It resolves the vault and stops unless `.obsidian` already exists there.
2. It downloads both files into Termux's temporary folder, over HTTPS only.
3. It checks the manifest's name, version and minimum app version, and that
   the first line of `theme.css` names the same version.
4. It stops, before changing anything, when `.obsidian/themes/j3w1` holds
   anything other than the two theme files, holds only one of them, or is a
   link.
5. It stages the new pair in a hidden `.j3w1-install-…` folder beside `j3w1`,
   moves the old `j3w1` folder into a hidden `.j3w1-backup-…` folder, then
   moves the staged folder into place. Both moves are renames within
   `.obsidian/themes`. It reports success only after checking that both files
   are directly in `j3w1`.
6. If the second move fails, it moves the old folder back. If that also fails,
   if it notices that something else changed `j3w1` or the vault folders
   during the swap, or if you stop it with Ctrl+C, it deletes nothing and
   prints what it kept: the previous theme's path while that path still
   exists, and whether `j3w1` already holds a complete new pair. If it does,
   keep it and delete the hidden copies later. Otherwise move whatever is at
   `j3w1` to a folder outside `.obsidian/themes` and check it, then move the
   previous `j3w1` folder back from `.j3w1-backup-…` before you start Obsidian.
7. After success it removes its temporary and hidden folders and prints the
   installed version. If it cannot remove one, it says which.

An abrupt stop the helper cannot notice, such as force-closing Termux, a
restart or a flat battery, prints nothing. Before starting Obsidian after one,
look in `.obsidian/themes` for `.j3w1-backup-…` and `.j3w1-install-…`
folders. If `j3w1` holds both files, keep it and delete the hidden folders.
If it is missing or incomplete, move whatever is at `j3w1` to a folder outside
`.obsidian/themes` and check it, then move the `j3w1` folder from inside
`.j3w1-backup-…` back into `.obsidian/themes`.

It writes only inside `.obsidian/themes`, as long as no other app changes the
vault's folders while it runs. Between steps it checks that its own folders
are still where it left them, and stops, deleting nothing, if it notices a
change; it cannot detect every change another app makes at the same moment.
Notes, plugins, snippets, settings and other themes are never touched. Besides `curl` and `jq` it uses only the
standard commands `mktemp`, `cp`, `mv`, `rm`, `mkdir`, `rmdir` and `chmod`.

## Manual fallback without Termux

This route does not check the files and keeps no backup; save the two old
files first if you may want them back.

1. Completely close Obsidian.
2. In a browser, download
   [manifest.json](https://j3w1.github.io/theme/ports/obsidian/manifest.json)
   and [theme.css](https://j3w1.github.io/theme/ports/obsidian/theme.css).
   Check that the saved names are exactly `manifest.json` and `theme.css`;
   rename a file if the browser added a number or an extension.
3. In a file manager, turn on hidden files, open the vault folder, then
   `.obsidian`. Create `themes` and inside it `j3w1` if they do not exist.
4. Move both files into `.obsidian/themes/j3w1/`, replacing both old files
   together. Do not start Obsidian with only one of them replaced.

## Enable

Open Obsidian, set **Settings → Appearance → Base color scheme → Dark**, then
select **j3w1** under **Themes**. Light mode is not supported.

## Update or roll back

To update, copy both installed files from `.obsidian/themes/j3w1` to a folder
outside `.obsidian/themes` if you may want to go back; the helper removes its
own backup once the new pair is in place. Close Obsidian, download the helper
again, review it again, and run it with the same vault. Restart Obsidian and
reselect the theme if necessary.

To roll back, close Obsidian, put both saved files back into
`.obsidian/themes/j3w1` together, then restart. To stop using the theme,
select Default under **Settings → Appearance → Themes**; after closing
Obsidian you may delete only the `j3w1` folder.

## Known limits

- No Android import, screenshot or device protocol is recorded. The mobile,
  tablet and phone rules come from a source audit; see
  [IMPLEMENTATION.md](IMPLEMENTATION.md).
- Vaults in app storage are not supported.
- Only Obsidian 1.13.4 and 1.13.7 are source-audited; later versions are not
  audited or imported.
- The helper replaces the whole `j3w1` folder, so keep your own CSS in
  `.obsidian/snippets`, not there.
- During the swap `j3w1` briefly does not exist, which is why Obsidian must
  stay closed.
