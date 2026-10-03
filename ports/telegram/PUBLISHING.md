# Publishing j3w1 for Telegram

This page is for the theme owner. People installing the theme never need it.

```sh
npm run telegram:publish
```

This one command creates the cloud theme the first time and updates it every time after. Run it in an interactive terminal from a clean checkout (after `npm ci`), at the commit you want to publish: it always publishes `HEAD`. Earlier revisions go through [rollback](#rolling-back).

## What the command does

1. **Checks the revision.**
   - Reads `dist/j3w1.attheme` and `dist/j3w1.tdesktop-theme` from the committed revision.
   - Refuses if their digests differ from that revision's `exports/port-capabilities.json`.
   - Refuses uncommitted changes under `ports/telegram`, `tokens` or `exports`, and runs `npm run check` and `npm run validate`.
2. **Sets up, only what is missing.**
   - Links <https://my.telegram.org/apps> and asks, with hidden input, for your `api_id` and `api_hash`, phone number, the login code Telegram sends, and your two-step verification password if you use one.
   - Telegram sends at most one login code per run.
   - Saves the session under `~/.local/state/j3w1-theme/telegram/` (owner-only permissions; `$J3W1_THEME_STATE_DIR`, or `$XDG_STATE_HOME`, overrides the location), then carries on in the same run.
3. **Finds the theme.**
   - Uses the slug in `cloud.json`. Before the first publication it tries `j3w1`, then `j3w1_theme`.
   - Adopts a theme only if Telegram says you created it. It never touches anyone else's.
   - If no candidate is available it stops and asks you for one more slug. Add it to `slugCandidates` in `cloud.json`, commit, and run the command again.
4. **Compares and uploads.**
   - Compares the Android and Desktop documents in the cloud with the committed files.
   - Uploads only those that differ, and creates the theme only if it does not exist yet.
   - Never sends accent `settings`, because Android would show those instead of the file.
5. **Verifies.**
   - Downloads both documents again and checks bytes, type, title, slug and ownership.
   - Prints the install link and writes a receipt to `…/telegram/receipts/`.
6. **First publication only.** Records the slug in `ports/telegram/cloud.json`. Then run `npm run generate` and commit: the README switches to the cloud link.

**Edge cases:**
- A run with nothing to change reports `unchanged`.
- After an interrupted or uncertain write, the next attempt reads the cloud state before writing anything, so just run the command again.
- Flood waits are honoured up to 10 minutes (2 in CI).
- `-- --dry-run` stops after the comparison and writes nothing.

## Rolling back

```sh
npm run telegram:publish -- rollback --ref <tag-or-commit>
```

This republishes an earlier reviewed revision to the same theme and the same link. The revision must be a tag or an ancestor of `origin/main`, and you confirm it by typing `ROLLBACK` followed by the full commit id it prints. If automatic publishing is enabled, also revert the change on `main`, or the next release publishes it again.

## Automatic publishing on release (optional)

```sh
npm run telegram:publish -- ci-enable
```

Publish once locally first: CI only updates the theme recorded in `cloud.json`, and both this command and the CI job refuse until it is there. It needs `gh` signed in with admin access to `j3w1/theme`, and asks you to type `ENABLE TELEGRAM CI`. It then:
- creates the GitHub environment `telegram`, restricted to `main`;
- logs in a **separate** Telegram session named "j3w1 theme CI" and stores it only as that environment's secret (never on disk or in logs);
- finally sets the repository variable `TELEGRAM_PUBLISH=enabled`.

From then on, a push to `main` that passes `release-gate` and changes `ports/telegram/dist/` publishes once, in order, with the same verification. Only the current tip of `main` is ever published, so rerunning an older workflow never republishes older files. Pull requests, forks and previews never receive the session.

## Disconnecting

```sh
npm run telegram:publish -- disconnect        # this computer
npm run telegram:publish -- disconnect --ci   # the GitHub environment
```

Each asks you to type a confirmation, then deletes the stored credentials. The local command also logs its session out and deletes the local receipts. The CI command turns automatic publishing off before deleting the secrets.

End the session in Telegram under **Settings → Devices** as well. This is required for the CI session, and for any session less than 24 hours old.

The session is a full account credential, not a theme-only token. Never paste it, a login code or your password into a chat, an issue or a command line.
