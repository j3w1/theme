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

Every value comes from a canonical role. Translucent native keys use the existing translucent roles. No colour is blended, lightened or given a new alpha.

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

| Target | Keys | Mapped | Inherited | Unset |
| --- | ---: | ---: | ---: | ---: |
| Android | 819 | 672 | 76 | 71 |
| Desktop | 586 | 457 | 83 | 46 |

Non-colour keys (`wallpaperFileOffset`, `chat_wallpaper_gradient_rotation`, `chat_outBubbleGradientAnimated`) and animated-wallpaper keys are never written.

**Main role assignments** (Android and Desktop project the same role wherever both expose it):

| Purpose | Role | Value |
| --- | --- | --- |
| Chat wallpaper | `surface.canvas` → `surface.chrome` | `#000000` → `#090707` |
| Incoming / outgoing bubble | `surface.raised` / `surface.overlay` | `#160b0b` / `#241010` |
| Selected bubble | `interaction.selection.bg` | `#531310` |
| Message, body and composer text | `text.default` | `#e99499` |
| Names and chrome titles | `text.bright` | `#ffa2a7` |
| Secondary text / timestamps | `text.muted` / `text.subtle` | `#bd787d` / `#ad7175` |
| Links and accents | `text.link`, `text.accent(-strong)`, `action.primary.*` | `#f73f35`, `#e53935`, `#7d1310` |
| Text on selection or filled actions | `text.on-selection`, `text.on-action` | `#f4eeee` |
| Overlays, ripples, selectors | `interaction.marquee`, `surface.backdrop` | `#9114101f`, `#000000a6` |

**Contrast and colour rules, enforced by tests:**
- The wallpaper is darker than incoming bubbles, and incoming bubbles are darker than outgoing ones.
- Message text, timestamps, replies and links pass 4.5:1 on both bubbles and on the main panels.
- Near-white appears only for selection, on-fill and link-hover text. Bold never selects white.
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
- **Window title bar.** On Windows, Telegram Desktop's title bar follows Telegram's palette only when Telegram draws its own frame. The system frame is drawn by Windows.
- **Wallpaper.** Android draws a native two-colour gradient. Desktop scales a 1×2 image of the same two colours. Neither uses a pattern or animation.
- **Host-controlled colours.** Translucent text and icons without an approved translucent role, chart data, Premium and story artwork, user colours and media keep Telegram's own colours.
- **Newer keys.** Keys Telegram adds after the pinned revisions use Telegram's light defaults until `keys.json` is refreshed.

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

**CI.** The CI job runs only on `main`, after `release-gate`, one run at a time, with read-only permissions and no persisted Git credentials. Secrets appear only in the publish step. It skips unchanged files and refuses to republish an older revision.

The API calls were checked against teleproto 1.229.1's TL definitions and client source (`tl/generated/api.d.ts`, `client/*.js`).

## Verification

**Tested in code** (`tests/telegram-port.test.js`, `tests/telegram-publish.test.js`):
- byte-identical generation across runs and time zones;
- the coverage, colour and contrast rules above;
- zip and PNG structure;
- every publisher outcome against a mock transport, including first publication, same-identity update, verified no-op, readback mismatch, foreign owner, slug fallback, revoked authorization, flood waits, interrupted writes, rollback and redaction;
- CI job isolation.

**Observed on a device:** none yet. Real imports are recorded in `evidence/` with the app version, OS, artifact digest and results. Until then, this port stays experimental.
