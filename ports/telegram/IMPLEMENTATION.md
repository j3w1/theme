# j3w1 for Telegram: implementation notes

## How it is built

```
tokens/ (default profile)
  └─ mapping.json (one mapping; native keys prefixed android: / desktop:)
       ├─ dist/j3w1.attheme          official Telegram for Android
       └─ dist/j3w1.tdesktop-theme   official Telegram Desktop (zip: colors.tdesktop-theme + background.png)
            └─ one Telegram Cloud Theme (Android + Desktop documents) → t.me/addtheme/<slug>
```

`npm run generate` writes both files through `scripts/lib/telegram-port.mjs`. They are generated output: never edit them, or the cloud theme, by hand.

Unchanged tokens always produce identical bytes:
- **Android:** signed 32-bit ARGB values, upstream key order, LF line endings, no timestamps.
- **Desktop:** `#rrggbb` / `#rrggbbaa` values, a stored (uncompressed) zip with a fixed date, and a hand-encoded 1×2 PNG.

Every value comes from a canonical role. Keys whose upstream default is translucent (overlays, ripples, selectors) take the existing translucent roles. The only opaque exceptions are two text keys listed in `src/coverage.json` (`opaqueAllowed`), bot-keyboard labels and code comments, because their translucent dark defaults are unreadable on dark panels. No colour is blended, lightened or given a new alpha.

## Upstream audit (pinned)

| Target | Source | Revision |
| --- | --- | --- |
| Android keys, fallbacks, file format | DrKLO/Telegram `ThemeColors.java`, `Theme.java` | `f2908b14133bbffbf7ab04f641ecb5bfaf533242` |
| Desktop palette keys | desktop-app/lib_ui `ui/colors.palette` | `b9242d3e711d2007e4872d19dd505c3580a63348` |
| Desktop loader, cloud themes, links | telegramdesktop/tdesktop | `d8594c011756265de4385408540bd9f7c787a003` |
| Cloud theme API | core.telegram.org `account.uploadTheme` / `createTheme` / `updateTheme` / `getTheme` | layer 225–229 |

`src/keys.json` holds only key names, inheritance links and which upstream defaults are translucent. It never stores upstream colour values. `node ports/telegram/src/extract-keys.mjs` refreshes it from these revisions. The target lines are Telegram Android 12.10.6 and Telegram Desktop 7.2.9.

**How each client fills a missing key:**
- **Android:** reads `key=value` lines. A key the file leaves out takes the file's value for its one-level fallback key, or otherwise Telegram's **light** default.
- **Desktop:** reads `key: value;` lines. A missing key takes the theme's value for its alias, or otherwise the light default.

## Coverage

Every upstream colour key is in exactly one of three states, and `tests/telegram-port.test.js` enforces this:
- **mapped**: set from a canonical role;
- **inherited**: its direct fallback or alias is mapped;
- **unset**: listed in `src/coverage.json` with a reason.

<!-- coverage:start -->
| Target | Keys | Mapped | Inherited | Unset |
| --- | ---: | ---: | ---: | ---: |
| Android | 819 | 667 | 85 | 67 |
| Desktop | 586 | 451 | 89 | 46 |
<!-- coverage:end -->

Non-colour keys (`wallpaperFileOffset`, `chat_wallpaper_gradient_rotation`, `chat_outBubbleGradientAnimated`) and animated-wallpaper keys are never written.

**Main role assignments.** Android and Desktop project the same role wherever both expose it. The exception is the Desktop chat-list badges; see [Limitations](#limitations).

| Purpose | Role |
| --- | --- |
| Chat wallpaper | `surface.canvas` → `surface.chrome` |
| Incoming / outgoing bubble | `surface.raised` / `surface.overlay` |
| Selected bubble | `interaction.selection.bg` |
| Message, body, composer and bot-keyboard text | `text.default` |
| Names and chrome titles | `text.bright` |
| Secondary text / timestamps / code comments | `text.muted` / `text.subtle` / `code.syntax.comment` |
| Links, accents, read and verified ticks | `text.link`, `text.accent`, `text.accent-strong` |
| Filled buttons (send, FAB, attach, file download, checkboxes), Android badges, Desktop sidebar and tray badges | `action.primary.*` |
| Desktop chat-list badges | light pills: `text.accent-strong`, `text.default`, `text.muted`, with `text.on-light` counts |
| Glyphs on selection, filled actions and media scrims | `interaction.selection.text`, `text.on-action` |
| Overlays, ripples, selectors | `interaction.marquee`, `surface.backdrop` |

**Contrast and colour rules, enforced by tests:**
- The wallpaper is darker than incoming bubbles, and incoming bubbles are darker than outgoing ones.
- Message text, timestamps, replies and links pass 4.5:1 on both bubbles and on the main panels.
- Near-white, by luminance, appears only on keys listed in `nearWhite` in `src/coverage.json`, inherited keys included. Each entry names the backgrounds the glyph is drawn on; the test checks every one is a selection, action or danger fill (or the media scrim behind loader and thumbnail icons) at 4.5:1 or more. Translucent scrims are measured composited over both white and black. Bold never selects white.
- Interface keys stay in the red/rose hue range: no blue, cyan, orange or purple.

## Cloud theme

**What the theme holds.** One theme titled "j3w1" holds:
- an Android document (format `android`, `application/x-tgtheme-android`, uploaded as `theme.attheme`);
- a Desktop document (format `tdesktop`, `application/x-tgtheme-tdesktop`, uploaded as `j3w1.tdesktop-theme`).

The same `https://t.me/addtheme/<slug>` link opens the matching document on each client, which shows a preview with **Apply**.

**What it deliberately leaves out.**
- The theme carries **no** accent `settings`. When settings exist, Android previews them and ignores the document.
- `account.installTheme` only tells the server a theme was applied. It does not change any client's appearance remotely, and the publisher does not call it.

**Updates.** When the owner updates the theme, Telegram pushes the change to everyone using it, and both clients also re-check about hourly. A theme installed from a file never updates.

**Slugs.** Slugs use `[A-Za-z0-9_]`. Hyphens never work: Desktop's link handler rejects them.

**Not supported.** Official clients that read neither format: Telegram for iOS, Telegram for macOS (App Store), Telegram Web and Telegram X.

## Limitations

- **Colours only.** Telegram owns fonts, sizes, bubble corners, spacing, glass/blur effects, motion and accessibility settings. The theme changes none of them.
- **No heading levels.** Messages have no H1–H6, and names and titles share bright rose. Once canonical D-033 lands, they move to `text.heading`.
- **Android selected bubbles.** Android uses the same message text colour for normal and selected bubbles; Desktop has separate selected foregrounds.
- **Platform keys differ.** Desktop exposes hover states that Android lacks. Android's outgoing-bubble gradient keys stay unset.
- **Desktop chat-list badges.** This is a deliberate, host-forced departure from the canonical Badge count variant (`action.primary.bg` with `action.primary.text`).
  - **Why:** Telegram Desktop reuses the draft-label and poll-icon colours as the reaction and poll badge fills, and uses one count colour per row state for every badge family. No dark fill can also be readable label text on the black row.
  - **The fills:** Desktop chat-list badges are light pills with dark `text.on-light` counts. Unread pills are `text.accent-strong`, reaction and poll pills are `text.default`, and muted pills are `text.muted`.
  - **On the selected row:** unread and reaction pills turn near-white and poll and muted pills rose, with the count in the row colour.
  - **Android and the Desktop sidebar** keep dark-red badges with near-white counts.
  - **Tested:** a test checks every family and row state, the pills against their rows, and the wide icons drawn on the rows (pinned `unread_badge_paint.cpp`, `dialogs_layout`).
- **Window title bar.** On Windows, Telegram Desktop's title bar follows Telegram's palette only when Telegram draws its own frame. The system frame is drawn by Windows.
- **Wallpaper.** Android draws a native two-colour gradient. Desktop scales a 1×2 image of the same two colours. Neither uses a pattern or animation.
- **Host-controlled colours.** Translucent text and icons without an approved translucent role, chart data, Premium and story artwork, user colours and media keep Telegram's own colours.
- **Newer keys.** Keys Telegram adds after the pinned revisions use Telegram's light defaults until `keys.json` is refreshed.
- **A theme with settings only.** The publisher treats a cloud theme that holds neither an Android nor a Desktop document as absent. The owner has no such theme; it would make the publisher fall back to the next slug.

## Installing from a file

- **Android:** download [`j3w1.attheme`](https://j3w1.github.io/theme/ports/telegram/j3w1.attheme) and open it in Telegram (or send it to your Saved Messages and tap it there), then tap **Apply**.
- **Desktop:** download [`j3w1.tdesktop-theme`](https://j3w1.github.io/theme/ports/telegram/j3w1.tdesktop-theme), open it with Telegram Desktop, click **Apply this theme**, then **Keep changes**.

## Troubleshooting

- **The link opens a web page.** Open it on a device where Telegram is installed, or paste it into any Telegram chat (Saved Messages works) and tap it there.
- **Colours change at night on Android.** Auto-night mode switches to its night theme. Pick j3w1 for night too, or turn auto-night off, in Telegram's chat settings.
- **One chat looks different.** That chat has its own chat theme; reset it from the chat's menu.
- **Desktop says the theme has no version for Telegram Desktop.** The cloud theme lacks its Desktop document; the owner runs `npm run telegram:publish`.
- **The theme reverted after 15 seconds on Desktop.** Click **Keep changes** after applying a file.

## Publisher and security

`publish.mjs` is one module. It imports only Node built-ins and `src/contract.mjs`; the pinned `teleproto` client is imported only when a live publication runs. teleproto was vetted before pinning: it has no install scripts and its dependency tree carries verified registry signatures. Dependabot ignores it, so updates are manual and re-vetted.

**How it publishes.**
- Artifacts are read from committed Git objects and checked against that revision's export digests before any login.
- A pure `converge` core does the work behind an injected transport, which the tests replace with a mock. It checks ownership, uploads only differing formats, never sends settings and verifies every write by download.
- Writes with an uncertain outcome are read back before any retry, within at most three rounds.
- A login code is requested at most once per run. Telegram's explicit data-centre redirects are followed at most twice.

**How it protects credentials.**
- The session and API credentials live only in private state: `~/.local/state/j3w1-theme/telegram/`, directories 0700, files 0600, never inside the repository.
- Hidden prompts collect the credentials. The publisher removes them from the environment after reading and redacts them from all output and receipts.

**CI.** A gate job without an environment decides first. It runs only on a push to `main` after `release-gate`, and passes only when the commit is the current tip of `main` and the dist files changed since the last successful Telegram publication. So a refused or rerun workflow records no deployment, and an older revision is never republished. The environment-bound publish job then runs one at a time with read-only permissions and no persisted credentials. Secrets appear only in its publish step, and the publisher checks the tip of `main` again. CI only updates the theme a verified local first publication recorded in `cloud.json`; it never creates one.

The API calls were checked against teleproto 1.229.1's TL definitions and client source (`tl/generated/api.d.ts`, `client/*.js`).

## Verification

**Tested in code** (`tests/telegram-port.test.js`, `tests/telegram-publish.test.js`):
- byte-identical generation across runs and time zones;
- the coverage, colour and contrast rules above;
- zip and PNG structure;
- every publisher outcome against a mock transport, including first publication, same-identity update, verified no-op, readback mismatch, foreign owner, slug fallback, revoked authorization, flood waits, interrupted writes, rollback and redaction;
- CI job isolation.

**Observed on a device:** none yet. Real imports are recorded in `evidence/` with the app version, OS, artifact digest and results. Until then, this port stays experimental.
