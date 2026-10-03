# Telegram publisher implementation

`publish.mjs` exports the transport-independent `converge` core, preflight,
Git adapter, state helpers and CLI `run`. Static imports are limited to Node
built-ins and `src/contract.mjs`. Teleproto imports occur only in the live
transport factory, so importing the core for tests cannot connect to Telegram.

The shared contract owns artifact paths, upload file names, format identifiers,
MIME types, cloud-config validation and install links. Preflight resolves a
commit, reads binary-safe Git blobs from that commit, and checks the export's
`sha256-<base64>` digests before authorization or mutation. The live adapter
normalizes Telegram's camelCase fields into the transport interface.

The core checks ownership, selects only a configured slug, compares downloaded
documents, and uploads only differing formats. The initial create supplies the
Android document; the Desktop update attaches its document to the same theme
id. No create or update includes `settings`, since nonempty settings cause
Android to ignore its theme document. The publisher never calls installTheme.

Every successful result requires downloaded bytes, MIME type, owner flag,
theme id, slug, title and empty settings to match. Three bounded rounds allow
readback after an uncertain upload, create or update before another write.
An uncertain create remains bound to its original slug; it cannot fall back
to create a second identity. A definite slug rejection permits configured
fallback. Flood waits use a bounded, injected clock; other permanent errors
and authorization loss stop immediately.

The CLI injects prompt, Git, filesystem, environment, clock, logger and
transport dependencies. It records private receipts with false Android and
Desktop import-observed fields. A redactor remembers every credential and
prompt answer, sanitizes logs, errors and receipts, and suppresses child-tool
stderr. Teleproto logging is disabled. The live adapter sets bounded connection
retries, disables library request retries and automatic flood sleeps, uses
explicit RPC timeouts, and destroys the client in `finally`. The CLI exits
explicitly so the update loop cannot hold it open.

API constructors and fields were checked against teleproto 1.229.1:

| Operation | Local authority |
| --- | --- |
| `account.UploadTheme`, `CreateTheme`, `UpdateTheme`, `GetTheme` | `tl/generated/api.d.ts`, account request declarations |
| `InputTheme`, `InputThemeSlug`, `InputDocument`, `Theme` | `tl/generated/api.d.ts`, constructor declarations |
| `auth.SendCode`, `SignIn`, `LogOut`, `CodeSettings` | `tl/generated/api.d.ts`, auth and constructor declarations |
| `connect`, `checkAuthorization`, `getMe`, `invoke` | `client/TelegramClient.js`, `client/users.js`, `client/auth.js` |
| `signInWithPassword`, password callback | `client/auth.js`, `client/TelegramClient.js` |
| `CustomFile`, `uploadFile`, `downloadMedia` | `client/uploads.d.ts`, `client/TelegramClient.js` |
| `StringSession`, `save` | `sessions/StringSession.js` |
| `deviceModel`, `destroy`, `setLogLevel`, constructor `baseLogger` | `client/telegramBaseClient.js`; `extensions/Logger.js` |
| RPC timeout, zero retries and zero flood threshold | `client/rpcControl.js`, `client/users.js`; options are the third `invoke` argument |
| Definitive login DC redirects, at most two | `client/TelegramClient.js` `_switchDC`; `client/users.js` migration policy and zero-retry early rejection |

The test suite uses small fixture bytes and injected transports, Git, prompts,
state and clocks. The live-adapter check replaces teleproto client methods
with stubs and serializes request objects without any network connection.
Workflow tests parse YAML and prove that Telegram secrets occur only in the
publisher step, while the job requires an opt-in `main` push and the existing
release gate. Browser suites prove rendering, not cloud or client imports;
these mock tests claim neither.

The environment configuration uses GitHub's
[environment API](https://docs.github.com/en/rest/deployments/environments)
and [deployment branch policies API](https://docs.github.com/en/rest/deployments/branch-policies).
It enables custom policies, enumerates every policy page, removes other branch
and tag policies, and creates an explicit `main` branch policy when needed.
Policy configuration precedes the fresh dedicated login; secret values are
passed to `gh secret set` through stdin, and the opt-in variable is set last.
