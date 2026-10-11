# Publishing j3w1 for Telegram

This page is for the theme owner. People installing the theme never need it.

<!-- cloud:start -->
| | |
| --- | --- |
| Cloud theme | j3w1, slug `TRhfHcbvZHlOucyc` |
| Install link | https://t.me/addtheme/TRhfHcbvZHlOucyc (awaiting owner verification) |
| Theme Editor | [Android](https://themes.contest.com/theme/TRhfHcbvZHlOucyc?format=android) · [TDesktop](https://themes.contest.com/theme/TRhfHcbvZHlOucyc?format=tdesktop) |
| Files | [j3w1.attheme](https://j3w1.github.io/theme/ports/telegram/j3w1.attheme) · [j3w1.tdesktop-theme](https://j3w1.github.io/theme/ports/telegram/j3w1.tdesktop-theme) |
<!-- cloud:end -->

There are two ways to put new files into the cloud theme. Both update the **same** theme, slug and install link, and Telegram then updates everyone using it. Never create a second theme for a release.

| | Theme Editor | Automatic publisher (optional) |
| --- | --- | --- |
| Needs | a Telegram login in a browser | a Telegram API application from my.telegram.org |
| Checks the result | by eye, on both clients | by downloading both documents and comparing bytes |

The colours always come from the j3w1 tokens and `mapping.json`. Change them there, run `npm run generate`, and publish the new files. Never recolour the theme in the editor: the next import replaces any hand edit.

## Publish with Telegram's Theme Editor

This route needs no API application, api_id or api_hash.

1. **Get the files.** Use the two files linked above, which are the released ones. To test files that are not released yet, download them from the pull request branch.
2. **Android.**
   - Open the Android Theme Editor link above.
   - Log in: Telegram sends a confirmation message to your account.
   - Click **IMPORT FILE** and choose `j3w1.attheme`. The editor shows the imported colours as text, but nothing is saved yet.
   - Click **SAVE AND APPLY THEME**. No message appears; the text stays as imported.
3. **Desktop.**
   - Switch to the **TDesktop** tab, or open its link above.
   - If the theme has no Desktop version yet, the tab first offers to create one.
   - Click **IMPORT FILE**, choose `j3w1.tdesktop-theme`, then **SAVE AND APPLY THEME**.
4. **Same theme.** Keep the `name` and `shortname` lines at the top of the editor text. The page address must stay `/theme/<slug>` with the slug above. If saving moves it to another address, the shortname was edited: restore it before going on.

Telegram converts an imported file into its own text form and rebuilds the document when you save; the Desktop zip is repacked. The cloud copy carries the same colours but not the same bytes, so on this route you check the result on the clients, not by digest.

The editor gives every key a file leaves out Telegram's default colour. The generated files therefore set every key the editor knows, inherited values included. After an import, the editor text should hold only j3w1 colours; a stray Telegram blue or green means a key is missing from the mapping.

### Check the install link

1. **Android:** open the install link on the phone, check the preview, and tap **Apply**.
2. **Desktop:** open the same link on Windows with Telegram Desktop installed. If a web page opens, press **Apply Theme** on it. Click **Apply this theme**, then **Keep changes** if Telegram asks.
3. **Look at the main screens** on both clients, as [Verification](IMPLEMENTATION.md#verification) lists. Then restart Telegram Desktop and confirm the theme stays.
4. **Record the result.** Record each client as a real-import entry in `port.json` `evidence`, with its report under `evidence/`. Then set `"verified": true` in `cloud.json`, run `npm run generate`, and commit. The README then leads with the install link.

## Automatic publishing (optional)

This route needs Telegram user API credentials (`api_id` and `api_hash`) from <https://my.telegram.org/apps>. Nothing else depends on it: installing, testing and updating the theme all work through the Theme Editor.

```sh
npm run telegram:publish
```

Run it in an interactive terminal from a clean checkout (after `npm ci`), at the commit you want to publish: it always publishes `HEAD`. Earlier revisions go through [rollback](#rolling-back).

**What the command does:**

1. **Checks the revision.**
   - Reads `dist/j3w1.attheme` and `dist/j3w1.tdesktop-theme` from the committed revision.
   - Refuses if their digests differ from that revision's `exports/port-capabilities.json`.
   - Refuses uncommitted changes under `ports/telegram`, `tokens` or `exports`, and runs `npm run check` and `npm run validate`.
2. **Sets up, only what is missing.**
   - Links <https://my.telegram.org/apps> and asks, with hidden input, for your `api_id` and `api_hash`, phone number, the login code Telegram sends, and your two-step verification password if you use one.
   - Telegram sends at most one login code per run.
   - Saves the session under `~/.local/state/j3w1-theme/telegram/` (owner-only permissions; `$J3W1_THEME_STATE_DIR`, or `$XDG_STATE_HOME`, overrides the location), then carries on in the same run.
3. **Finds the theme.**
   - Uses the `slug` in `cloud.json`, which is the theme created with the Theme Editor. It adopts that theme because Telegram reports you as its creator, and never creates a duplicate.
   - It never touches anyone else's theme.
   - Only while `slug` is empty does it create a new theme, named from `slugCandidates`.
4. **Compares and uploads.**
   - Compares the Android and Desktop documents in the cloud with the committed files.
   - Uploads only those that differ. The first run after a Theme Editor save replaces the editor's rebuilt documents with the exact generated bytes, and reports `updated`.
   - Never sends accent `settings`, because Android would show those instead of the file.
5. **Verifies.**
   - Downloads both documents again and checks bytes, type, title, slug and ownership.
   - Prints the install link and writes a receipt to `…/telegram/receipts/`.
6. **New theme only.** Records the new slug in `ports/telegram/cloud.json`. Run `npm run generate` and commit, then [check the install link](#check-the-install-link). `verified` stays false until you do.

**Edge cases:**
- A run with nothing to change reports `unchanged`.
- After an interrupted or uncertain write, the next attempt reads the cloud state before writing anything, so just run the command again.
- Flood waits are honoured up to 10 minutes (2 in CI).
- `-- --dry-run` stops after the comparison and writes nothing.

### Rolling back

```sh
npm run telegram:publish -- rollback --ref <tag-or-commit>
```

This republishes an earlier reviewed revision to the same theme and the same link. The revision must be a tag or an ancestor of `origin/main`. You confirm it by typing `ROLLBACK` followed by the full commit id it prints. If automatic publishing is enabled, also revert the change on `main`, or the next release publishes it again.

On the Theme Editor route, rolling back means importing the files of the earlier release.

### Automatic publishing on release

```sh
npm run telegram:publish -- ci-enable
```

CI only updates the theme recorded in `cloud.json`, and only once `verified` is true. Both this command and the CI job refuse until then.

It needs `gh` signed in with admin access to `j3w1/theme`, and asks you to type `ENABLE TELEGRAM CI`. It then:
- creates the GitHub environment `telegram`, restricted to `main`;
- logs in a **separate** Telegram session named "j3w1 theme CI" and stores it only as that environment's secret (never on disk or in logs);
- finally sets the repository variable `TELEGRAM_PUBLISH=enabled`.

From then on, a push to `main` that passes `release-gate` and changes `ports/telegram/dist/` publishes once, in order, with the same verification. Only the current tip of `main` is ever published, so rerunning an older workflow never republishes older files. Pull requests, forks and previews never receive the session.

### Disconnecting

```sh
npm run telegram:publish -- disconnect        # this computer
npm run telegram:publish -- disconnect --ci   # the GitHub environment
```

Each asks you to type a confirmation, then deletes the stored credentials. The local command also logs its session out and deletes the local receipts. The CI command turns automatic publishing off before deleting the secrets.

End the session in Telegram under **Settings → Devices** as well. This is required for the CI session, and for any session less than 24 hours old.

The session is a full account credential, not a theme-only token. Never paste it, a login code or your password into a chat, an issue or a command line.
