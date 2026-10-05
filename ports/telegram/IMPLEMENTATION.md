# j3w1 for Telegram: implementation notes

## How it is built

```
tokens/ (default profile) + mapping.json (native keys prefixed android: / desktop:)
                 │  npm run generate (deterministic)
       ┌─────────┴──────────┐
dist/j3w1.attheme    dist/j3w1.tdesktop-theme
  (Android)            (Desktop: zip of colors.tdesktop-theme + background.png)
       └─────────┬──────────┘
     one Telegram Cloud Theme, slug in cloud.json
                 ├── Telegram's Theme Editor: IMPORT FILE, SAVE AND APPLY THEME (no API application)
                 └── npm run telegram:publish (optional; api_id/api_hash)
                 │
     https://t.me/addtheme/<slug>  →  Apply on Android and on Telegram Desktop
```

`npm run generate` writes both files through `scripts/lib/telegram-port.mjs`.
- **The files are generated output.** They are committed, and never edited by hand.
- **The cloud theme is a distribution channel, not a palette source.** It is never recoloured on its own. Every change starts in the tokens or the mapping, is regenerated, and is then imported or published.

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
| Target | Keys | Mapped | Inherited | Unset | Legacy editor keys |
| --- | ---: | ---: | ---: | ---: | ---: |
| Android | 819 | 666 | 86 | 67 | 77 |
| Desktop | 586 | 450 | 91 | 45 | 0 |
<!-- coverage:end -->

Non-colour keys (`wallpaperFileOffset`, `chat_wallpaper_gradient_rotation`, `chat_outBubbleGradientAnimated`) and animated-wallpaper keys are never written.

**Inherited keys are written out.** The files write every inherited key with the value it inherits, so a file import renders exactly as the clients' inheritance would. Telegram's Theme Editor fills every key a file leaves out with Telegram's stock colour. On 2026-10-05 it did that to 42 inherited Android keys, which turned read ticks green and value icons blue. Writing the inherited values out leaves the editor nothing to fill. Unset keys stay out; the editor knows none of them.

**Legacy editor keys.** The editor also writes 77 Android keys that the pinned client no longer reads, such as `chat_attachFileBackground` and `chat_outPreviewInstantSelectedText`. `src/editor-keys.json` lists them with their source. Three were last read by Telegram Android 11.4.2; the rest were gone by 9.7.6. `mapping.json` gives each the role its current counterpart uses, so older clients and the editor text carry j3w1 colours too.

**Main role assignments.** Android and Desktop project the same role wherever both expose it. The exception is the Desktop chat-list badges; see [Limitations](#limitations).

| Purpose | Role |
| --- | --- |
| Chat wallpaper | `surface.canvas` → `surface.chrome` |
| Incoming / outgoing bubble | `surface.raised` / `surface.overlay` |
| Selected bubble | `interaction.selection.bg` |
| Message, body, composer and bot-keyboard text | `text.default` |
| Names and chrome titles | `text.bright` |
| Secondary text / timestamps / code comments | `text.muted` / `text.subtle` / `code.syntax.comment` |
| Links, accents, read and verified ticks, list section headers | `text.link`, `text.accent`, `text.accent-strong` |
| Filled buttons (send, FAB, attach, checkboxes), file and voice button circles, Android badges, Desktop sidebar and tray badges | `action.primary.*` |
| Desktop chat-list badges | light pills: `text.accent-strong`, `text.default`, `text.muted`, with `text.on-light` counts |
| Glyphs on selection, filled actions (file and voice buttons included) and media scrims | `interaction.selection.text`, `text.on-action` |
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

**One identity, two ways to publish.** `cloud.json` records the theme's slug: `TRhfHcbvZHlOucyc`, which Telegram generated when the owner created the theme in the Theme Editor. Both routes write to that theme. They differ in what reaches the cloud:
- **Theme Editor.** **IMPORT FILE** converts the file into the editor's text form, and **SAVE AND APPLY THEME** rebuilds the document from that text (the Desktop zip is repacked).
  - The colours the file sets carry over, but not the bytes.
  - Every key the file leaves out gets Telegram's default, which is why the files write inherited keys out (see [Coverage](#coverage)).
  - The editor keeps the theme's `name` and `shortname` lines and saves to the same theme id, so the Android and TDesktop tabs fill one theme.
- **Publisher.** Uploads the exact generated bytes and verifies them by download. Its first run after an editor save reports `updated`.

**What `verified` means.** The guide leads with the install link only when `cloud.json` says `verified`, which the owner sets by hand after applying the link on both clients and recording the evidence. These are separate facts, recorded separately:
1. the cloud theme exists;
2. its Android document is imported;
3. its Desktop document is imported;
4. the link resolves;
5. Android applies it;
6. Desktop applies it.

**Slugs.** Both clients accept 5 to 64 characters of `[A-Za-z0-9_]`, starting with a letter and not ending with `_` (pinned `ThemeSetUrlActivity`, `IsGoodSlug`). Telegram's generated slugs are 16 letters and digits. Hyphens never work: Desktop's link handler rejects them. `j3w1` is too short, so it is not a candidate; `j3w1_theme` is kept only to name a new theme if `slug` is ever empty.

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
- **Android white glyphs Telegram fixes in code.** The theme sets only the fills behind them:
  - **Composer send and mic buttons:** the icon is always white (`ChatActivityEnterView`, new design), drawn on `chat_messagePanelSend`, the accent red. That is about 3.4:1, above the 3:1 needed for an icon but below the 4.5:1 used for near-white text here.
  - **Profile action buttons (Message, Mute, …):** labels are white, or black on a light button, chosen by brightness (`ProfileActionsView`).
- **Desktop trending stickers' "installed" button.** Its style (`stickersTrendingInstalled`) uses the primary-button fill, `activeButtonBg`, as text on `lightButtonBgOver`. That fill must be dark for its near-white button text, so this one label stays dim (about 1.8:1). No palette can satisfy both uses.
- **Android Settings icons.** Telegram Android 12.x paints the coloured squares behind the Settings icons from fixed gradients in its code (`IconBackgroundColors`, `SettingsActivity`), not from theme keys. They stay blue, orange, green and purple under every theme. On Desktop they are theme keys and use the action fill.
- **Newer keys.** Keys Telegram adds after the pinned revisions use Telegram's light defaults until `keys.json` is refreshed.
- **Desktop style-file colours.** Telegram Desktop's own `.style` files name a few more colours, such as `overviewFileExtFg`, that are not palette keys. They follow the palette key they point to, so the theme reaches them only through those keys, and the audit lists palette keys only.
- **Accent settings.** A cloud theme that carries accent `settings` shows those settings on Android instead of its document. The publisher refuses such a theme at readback. On the Theme Editor route, the Android check on the device is what would reveal it.
- **A theme with settings only.** The publisher treats a cloud theme that holds neither an Android nor a Desktop document as absent. At the recorded slug, it would then try to create a theme there, which Telegram refuses as occupied.

## Installing from a file

- **Android:** download [`j3w1.attheme`](https://j3w1.github.io/theme/ports/telegram/j3w1.attheme) and open it in Telegram (or send it to your Saved Messages and tap it there), then tap **Apply**.
- **Desktop:** download [`j3w1.tdesktop-theme`](https://j3w1.github.io/theme/ports/telegram/j3w1.tdesktop-theme), open it with Telegram Desktop, click **Apply this theme**, then **Keep changes**.

## Troubleshooting

- **The link opens a web page.** Open it on a device where Telegram is installed, or paste it into any Telegram chat (Saved Messages works) and tap it there.
- **Colours change at night on Android.** Auto-night mode switches to its night theme. Pick j3w1 for night too, or turn auto-night off, in Telegram's chat settings.
- **One chat looks different.** That chat has its own chat theme; reset it from the chat's menu.
- **Desktop says "Sorry, this theme doesn't include a version for Telegram Desktop."** The cloud theme lacks its Desktop document. The owner imports `j3w1.tdesktop-theme` in the Theme Editor's TDesktop tab and saves (or runs `npm run telegram:publish`). The file install works meanwhile.
- **Android says "Sorry, this color theme doesn't support your device yet."** The cloud theme lacks its Android document. The owner imports `j3w1.attheme` in the Android tab and saves.
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

**CI.** A gate job without an environment decides first. It runs only on a push to `main` after `release-gate`, and passes only when the commit is the current tip of `main` and the dist files changed since the last successful Telegram publication. So a refused or rerun workflow records no deployment, and an older revision is never republished. The environment-bound publish job then runs one at a time with read-only permissions and no persisted credentials. Secrets appear only in its publish step, and the publisher checks the tip of `main` again. CI only updates the theme recorded in `cloud.json`, and only after the owner has set it `verified`; it never creates one.

**Without credentials.** `npm run generate`, `check`, `validate` and the tests never read Telegram credentials or contact Telegram, and neither does the Theme Editor route. Only `publish.mjs` and the opt-in CI job do.

The API calls were checked against teleproto 1.229.1's TL definitions and client source (`tl/generated/api.d.ts`, `client/*.js`).

## Verification

**Tested in code** (`tests/telegram-port.test.js`, `tests/telegram-publish.test.js`):
- byte-identical generation across runs and time zones;
- the coverage, colour and contrast rules above;
- zip and PNG structure;
- the generated guide's three cloud states (none, awaiting verification, verified) and its Theme Editor and install links;
- every publisher outcome against a mock transport, including first publication, adopting the Theme Editor's theme by its recorded slug, same-identity update, verified no-op, readback mismatch, foreign owner, slug fallback, revoked authorization, flood waits, interrupted writes, rollback and redaction;
- CI job isolation.

**Observed on a device:** none yet. Each real import is recorded in `evidence/`, and listed in `port.json`, with the app version, OS, artifact digest and results. The record keeps apart:
- the Theme Editor accepting a file;
- the link opening a preview;
- the theme being applied;
- the theme passing a visual check.

Until both clients are recorded, this port stays experimental.

**Visual check, on Android and on Telegram Desktop for Windows:**
- **Chats:** the chat list and the unread badges; one chat, with incoming and outgoing bubbles, message text, names, timestamps and links; a reply or quote; the composer and the send button.
- **Other screens:** settings, a profile or dialog, and, on Desktop, hover and selection.
- **Wallpaper:** the chat wallpaper.

**Expected:** black to red-black surfaces, rose text, muted rose metadata, bright rose names and titles, red and rose accents, near-white only on red fills, and no Telegram blue or cyan. A problem is fixed in the tokens, the mapping or the generator, regenerated and imported again, never by editing the cloud theme.
