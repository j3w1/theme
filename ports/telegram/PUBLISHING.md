# Publish the Telegram Cloud Theme

`npm run telegram:publish` publishes one theme titled `j3w1`, with an Android
document and a Desktop document, then downloads both to verify their bytes and
metadata. It prints `https://t.me/addtheme/<slug>`. Cloud readback does not prove
that either client has imported the theme; both import-observed receipt fields
remain false.

## First local publication

Generate and commit the port artifacts and their exports before publishing.
The publisher reads the committed Git objects at `HEAD`, checks each SHA-256
digest against that revision's `exports/port-capabilities.json`, refuses dirty
files under `ports/telegram`, `tokens` and `exports`, and runs `npm run check`
and `npm run validate`.

Run in a terminal:

```sh
npm run telegram:publish
```

If setup is missing, the command points to <https://my.telegram.org/apps> and
asks for `api_id` and `api_hash`, phone number, login code, and a 2FA password
when needed. Input is hidden. One logical login-code request follows at most
two definitive data-center redirects before delivery; an uncertain response
is never retried. At most one code is delivered in a run. An unsuccessful
login requires a new run. Use a Telegram user account; bots
cannot publish Cloud Themes.

Credentials and session go in `telegram/auth.json` beneath
`$J3W1_THEME_STATE_DIR`, or beneath
`${XDG_STATE_HOME:-~/.local/state}/j3w1-theme` when no override is set.
The state root must be outside the worktree, including through symlinks.
State directories use mode 0700; auth and receipt files use mode 0600 and
atomic replacement. Session strings authorize access to the account: keep
state private and outside version control.

The command tries only `cloud.json`'s configured candidates. It adopts a theme
only when Telegram says the logged-in user created it. A rejected or foreign
slug tries the next candidate; exhausting the list asks for one replacement
slug. Once `cloud.json.slug` is set, publication and rollback use that identity.

After the first verified local publication, the command writes the accepted
slug and `published: true` to `cloud.json`. Run `npm run generate`, inspect the
generated changes, and commit them. CI never writes this file.

## Update, inspect and rollback

```sh
npm run telegram:publish -- --dry-run
npm run telegram:publish -- --ref v3.1.0
npm run telegram:publish -- rollback --ref v3.1.0
```

A dry run preflights the source and compares the remote documents without
writing files, uploading documents, creating a theme or changing one. Missing
credentials report `Setup required` without prompting. Later publication
uploads and replaces only documents whose bytes or MIME type differ; a
verified no-op prints `unchanged` and exits zero.

Rollback requires a tag or a commit that is an ancestor of `origin/main`, and
the exact typed confirmation `ROLLBACK <resolved-full-commit>`. It replaces
documents on the same cloud identity. Fetch the remote refs first when the
local `origin/main` is stale.

Every attempted publication with a preflighted source records a receipt at
`telegram/receipts/<ISO-time>-<shortsha>.json`. A receipt records the source,
document digests, slug, theme id, outcome and readback result. Failure never
records a verified success. A request with an uncertain outcome is followed
by a readback before retrying; convergence is bounded to three rounds.
Telegram flood waits are bounded to 600 seconds locally and 120 seconds in CI;
longer waits report when to retry.

## Enable main-only release publishing

The repository starts with no Telegram secrets and no automatic publication.
The owner can opt in with:

```sh
npm run telegram:publish -- ci-enable
```

This requires an authenticated `gh` CLI and the typed confirmation
`ENABLE TELEGRAM CI`. It creates or updates the `telegram` GitHub environment
to allow only the `main` branch, performs a fresh login under the device name
`j3w1 theme CI`, sends the three credentials to environment secrets through
stdin, and finally sets the repository variable `TELEGRAM_PUBLISH` to
`enabled`. The dedicated CI session is never saved to local state, argv or logs.

The release hook runs only on a push to `main` after `release-gate` succeeds.
It waits for the Pages job to finish even when that job is skipped. Credentials
are available only to the publisher step, which connects and checks
authorization without prompting, consumes its credential environment keys,
and reads artifacts at the exact pushed SHA. The hook skips identical artifact
bytes and skips old reruns whose last successful Telegram deployment is not
an ancestor of the checkout. A failed deployment lookup stops publication.

## Disconnect

```sh
npm run telegram:publish -- disconnect
npm run telegram:publish -- disconnect --ci
```

Local disconnection requires `DISCONNECT TELEGRAM`, calls `auth.logOut` when
a session exists, and removes local publisher state. In Telegram, open
**Settings → Devices** and terminate the publisher session as well; this is
needed when a session is less than 24 hours old or server logout fails.

CI disconnection requires `DISCONNECT TELEGRAM CI`, deletes the three secrets
from environment `telegram`, and deletes the repository opt-in variable.
It does not terminate the Telegram session remotely: terminate the dedicated
device in **Settings → Devices**.
