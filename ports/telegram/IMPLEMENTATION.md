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

`npm run generate` writes both files through `scripts/lib/telegram-port.mjs`. They are committed and never edited by hand. The cloud theme is a distribution channel, not a palette source: every change starts in the tokens or the mapping, is regenerated, and is then imported or published.

Unchanged tokens always produce identical bytes:
- **Android:** signed 32-bit ARGB values, upstream key order, LF line endings, no timestamps.
- **Desktop:** `#rrggbb` / `#rrggbbaa` values, a stored (uncompressed) zip with a fixed date, and a hand-encoded 1×2 PNG.

Every value comes from a canonical role; no colour is blended, lightened or given a new alpha. Keys whose upstream default is translucent (overlays, ripples, selectors) take the translucent roles. The only opaque exceptions are the two text keys in `src/coverage.json` (`opaqueAllowed`), bot-keyboard labels and code comments, whose translucent dark defaults are unreadable on dark panels.

## Upstream audit (pinned)

| Target | Source | Revision |
| --- | --- | --- |
| Android keys, fallbacks, file format | DrKLO/Telegram `ThemeColors.java`, `Theme.java` | `f2908b14133bbffbf7ab04f641ecb5bfaf533242` |
| Desktop palette keys | desktop-app/lib_ui `ui/colors.palette` | `b9242d3e711d2007e4872d19dd505c3580a63348` |
| Desktop loader, cloud themes, links | telegramdesktop/tdesktop | `d8594c011756265de4385408540bd9f7c787a003` |
| Cloud theme API | core.telegram.org `account.uploadTheme` / `createTheme` / `updateTheme` / `getTheme` | layer 225–229 |

`src/keys.json` holds only key names, inheritance links and which upstream defaults are translucent, never upstream colour values. `node ports/telegram/src/extract-keys.mjs` refreshes it from these revisions. The target lines are Telegram Android 12.10.6 and Telegram Desktop 7.2.9. Keys Telegram adds after the pinned revisions use Telegram's light defaults until `keys.json` is refreshed.

A key the file leaves out:
- **Android** (`key=value` lines) takes the file's value for its one-level fallback key, or otherwise Telegram's **light** default.
- **Desktop** (`key: value;` lines) takes the theme's value for its alias, or otherwise the light default.

## Coverage

Every upstream colour key is in exactly one of three states, and `tests/telegram-port.test.js` enforces this:
- **mapped**: set from a canonical role;
- **inherited**: its direct fallback or alias is mapped;
- **unset**: listed in `src/coverage.json` with a reason.

<!-- coverage:start -->
| Target | Keys | Mapped | Inherited | Unset | Legacy editor keys |
| --- | ---: | ---: | ---: | ---: | ---: |
| Android | 819 | 666 | 86 | 67 | 77 |
| Desktop | 586 | 448 | 93 | 45 | 0 |
<!-- coverage:end -->

Non-colour keys (`wallpaperFileOffset`, `chat_wallpaper_gradient_rotation`, `chat_outBubbleGradientAnimated`) and animated-wallpaper keys are never written.

**Inherited keys are written out** with the value they inherit, so a file import renders exactly as the clients' inheritance would. Telegram's Theme Editor fills every key a file leaves out with Telegram's stock colour: on 2026-10-05 it did that to 42 inherited Android keys, turning read ticks green and value icons blue. Unset keys stay out; the editor knows none of them.

**Legacy editor keys.** The editor also writes Android keys the pinned client no longer reads, such as `chat_attachFileBackground` and `chat_outPreviewInstantSelectedText`. `src/editor-keys.json` lists them with their source: three were last read by Telegram Android 11.4.2, the rest were gone by 9.7.6. `mapping.json` gives each the role its current counterpart uses, so older clients and the editor text carry j3w1 colours too.

**Main role assignments.** Android and Desktop project the same role wherever both expose it, except the Desktop chat-list badges ([Limitations](#limitations)).

| Purpose | Role |
| --- | --- |
| Chat wallpaper | `surface.canvas` → `surface.chrome` |
| Incoming / outgoing bubble | `surface.raised` / `surface.accent` (D-035) |
| Selected bubble | `interaction.selection.bg` |
| Text selection | Android: `interaction.text-selection.tint` (D-036) on `chat_textSelectBackground`, which the incoming and outgoing highlights inherit; Desktop: `selection.bg`, with near-white selected text |
| Message, body, composer and bot-keyboard text | `text.default` |
| Names and chrome titles | `text.bright` |
| Secondary text, bubble timestamps and durations | `text.muted` (never `text.subtle` on the accent surface, D-035) |
| Chat-list dates, media-overlay times and other metadata | `text.subtle` |
| Code comments | `code.syntax.comment` |
| Links, accents, read and verified ticks, list section headers | `text.link`, `text.accent`, `text.accent-strong` |
| Filled buttons (send, FAB, attach, checkboxes), file and voice button circles, Android badges, Desktop sidebar and tray badges | `action.primary.*` |
| Glyphs on selection, filled actions (file and voice buttons included) and media scrims | `interaction.selection.text`, `text.on-action` (bright rose under D-033) |
| Overlays, ripples, selectors | `interaction.marquee`, `surface.backdrop` |

**Contrast and colour rules, enforced by tests:**
- The wallpaper is darker than incoming bubbles, and incoming bubbles are darker than outgoing ones.
- Message text, timestamps, replies and links pass 4.5:1 on both bubbles and on the main panels.
- The reviewed `onFill` table in `src/coverage.json` records every on-fill foreground/background pair, inherited keys included; near-white appears only within it. Each entry names the backgrounds its glyph is drawn on, and the test checks every one is a selection, action or danger fill (or the media scrim behind loader and thumbnail icons) at 4.5:1 or more. Translucent scrims are measured composited over both white and black. Bold never selects white.
- Interface keys stay in the red/rose hue range: no blue, cyan, orange or purple.

## Cloud theme

One theme titled "j3w1" holds an Android document (format `android`, `application/x-tgtheme-android`, uploaded as `theme.attheme`) and a Desktop document (format `tdesktop`, `application/x-tgtheme-tdesktop`, uploaded as `j3w1.tdesktop-theme`). The same `https://t.me/addtheme/<slug>` link opens the matching document on each client, which shows a preview with **Apply**. When the owner updates the theme, Telegram pushes the change to everyone using it, and both clients also re-check about hourly.

**What it leaves out.**
- **No** accent `settings`. When settings exist, Android previews them instead of the document. The publisher refuses such a theme at readback; on the Theme Editor route, only the Android check on the device would reveal it.
- `account.installTheme` only tells the server a theme was applied. It changes no client's appearance remotely, and the publisher does not call it.

**One identity, two ways to publish** ([Publishing](PUBLISHING.md)). `cloud.json` records the slug `TRhfHcbvZHlOucyc`, which Telegram generated when the owner created the theme in the Theme Editor. Both routes write to that theme:
- **Theme Editor.** **IMPORT FILE** converts the file into the editor's text form, and **SAVE AND APPLY THEME** rebuilds the document from that text (the Desktop zip is repacked). The colours carry over, the bytes do not, and every key the file leaves out gets Telegram's default ([Coverage](#coverage)). The editor keeps the `name` and `shortname` lines and saves to the same theme id, so the Android and TDesktop tabs fill one theme.
- **Publisher.** Uploads the exact generated bytes and verifies them by download. Its first run after an editor save reports `updated`.

**What `verified` means.** The guide leads with the install link only when `cloud.json` says `verified`, which the owner sets by hand after applying the link on both clients and recording the evidence. Recorded separately: the cloud theme exists; its Android document is imported; its Desktop document is imported; the link resolves; Android applies it; Desktop applies it.

**Slugs.** Both clients accept 5 to 64 characters of `[A-Za-z0-9_]`, starting with a letter and not ending with `_` (pinned `ThemeSetUrlActivity`, `IsGoodSlug`). Telegram's generated slugs are 16 letters and digits. Hyphens never work: Desktop's link handler rejects them. `j3w1` is too short, so it is not a candidate; `j3w1_theme` is kept only to name a new theme if `slug` is ever empty.

## Limitations

- **Colours only.** Telegram owns fonts, sizes, bubble corners, spacing, glass/blur effects, motion and accessibility settings.
- **No independent heading hook.** The pinned formats expose shared names and chrome titles (bright rose under D-033) but no independent H1–H6 foreground, so `text.heading` is unsupported rather than turning UI names or all bold text near-white. `text.highlight` is mapped only to Desktop's two thumbnail controls (`historyFileThumbIconFg`, `historyFileThumbRadialFg`): bright rose on their media scrim falls below 4.5:1 over white media, so these glyphs keep an explicit near-white highlight.
- **Android selected bubbles** use the same message text colour as normal bubbles; Desktop has separate selected foregrounds.
- **Android text selection.** Android keeps the text and code colours inside a selection; Desktop turns selected text and links near-white. The opaque `text-selection.bg` would therefore leave rose text below 4.5:1, so Android takes the translucent tint, which also keeps visible the content that some pinned paths paint the fill over: the rich editor's tables, captions and media blocks, and the rich-message translation preview.
  - Rose text stays at 4.5:1 or above where the tint is drawn under it (messages, the message field, instant view).
  - Below 4.5:1 while a selection lasts: selected text the tint covers (rich-editor tables and captions, the translation preview), links, code-block keyword, string and comment colours, and, in outgoing blocks only, number and constant colours. D-036 records the measured ratios and colour distances.
- **Platform keys differ.** Desktop exposes hover states that Android lacks. Android's outgoing-bubble gradient keys stay unset.
- **Desktop chat-list badges.** A deliberate, host-forced departure from the canonical Badge count variant (`action.primary.bg` with `action.primary.text`).
  - **Why:** Telegram Desktop reuses the draft-label and poll-icon colours as the reaction and poll badge fills, and uses one count colour per row state for every badge family. No dark fill can also be readable label text on the black row.
  - **The fills:** light pills with dark `text.on-light` counts. Unread pills are `text.accent-strong`, reaction and poll pills `text.default`, muted pills `text.muted`.
  - **On the selected row:** unread and reaction pills turn near-white and poll and muted pills rose, with the count in the row colour.
  - **Android and the Desktop sidebar** keep dark-red badges with near-white counts.
  - **Tested:** every family and row state, the pills against their rows, and the wide icons drawn on the rows (pinned `unread_badge_paint.cpp`, `dialogs_layout`).
- **Window title bar.** On Windows, Telegram Desktop's title bar follows Telegram's palette only when Telegram draws its own frame; Windows draws the system frame.
- **Wallpaper.** Android draws a native two-colour gradient; Desktop scales a 1×2 image of the same two colours. Neither uses a pattern or animation.
- **Host-controlled colours.** Translucent text and icons without an approved translucent role, chart data, Premium and story artwork, user colours and media keep Telegram's own colours.
- **Android white glyphs Telegram fixes in code.** The theme sets only the fills behind them:
  - **Composer send and mic buttons:** the icon is always white (`ChatActivityEnterView`, new design), drawn on `chat_messagePanelSend`, the accent red: above the 3:1 needed for an icon, below the 4.5:1 used for near-white text here.
  - **Profile action buttons (Message, Mute, …):** labels are white, or black on a light button, chosen by brightness (`ProfileActionsView`).
- **Desktop trending stickers' "installed" button.** Its style (`stickersTrendingInstalled`) uses the primary-button fill, `activeButtonBg`, as text on `lightButtonBgOver`. That fill must be dark for its near-white button text, so this one label stays dim, below 3:1. No palette can satisfy both uses.
- **Android Settings icons.** Telegram Android 12.x paints the squares behind the Settings icons from fixed gradients in its code (`IconBackgroundColors`, `SettingsActivity`), not theme keys, so they stay blue, orange, green and purple under every theme. On Desktop they are theme keys and use the action fill.
- **Desktop style-file colours.** Telegram Desktop's `.style` files name a few colours, such as `overviewFileExtFg`, that are not palette keys. They follow the palette key they point to, so the theme reaches them only through those keys; the audit lists palette keys only.

## Publisher and security

`publish.mjs` is one module. It imports only Node built-ins and `src/contract.mjs`; the pinned `teleproto` client is imported only when a live publication runs. teleproto was vetted before pinning: it has no install scripts and its dependency tree carries verified registry signatures. Dependabot ignores it, so updates are manual and re-vetted. The API calls were checked against teleproto 1.229.1's TL definitions and client source (`tl/generated/api.d.ts`, `client/*.js`).

**How it publishes.**
- Artifacts are read from committed Git objects and checked against that revision's export digests before any login.
- A pure `converge` core does the work behind an injected transport, which the tests replace with a mock. It checks ownership, uploads only differing formats, never sends settings and verifies every write by download.
- Writes with an uncertain outcome are read back before any retry, within at most three rounds.
- A login code is requested at most once per run. Telegram's explicit data-centre redirects are followed at most twice.
- A cloud theme that holds neither an Android nor a Desktop document counts as absent. At the recorded slug the publisher would then try to create a theme, which Telegram refuses as occupied.

**How it protects credentials.**
- The session and API credentials live only in private state: `~/.local/state/j3w1-theme/telegram/`, directories 0700, files 0600, never inside the repository.
- Hidden prompts collect the credentials. The publisher removes them from the environment after reading and redacts them from all output and receipts.

**CI.** A gate job without an environment decides first. It runs only on a push to `main` after `release-gate`, and passes only when the commit is the current tip of `main` and the dist files changed since the last successful Telegram publication. So a refused or rerun workflow records no deployment, and an older revision is never republished. The environment-bound publish job then runs one at a time with read-only permissions and no persisted credentials. Secrets appear only in its publish step, and the publisher checks the tip of `main` again. CI only updates the theme recorded in `cloud.json`, and only after the owner has set it `verified`; it never creates one.

**Without credentials.** `npm run generate`, `check`, `validate`, the tests and the Theme Editor route never read Telegram credentials or contact Telegram. Only `publish.mjs` and the opt-in CI job do.

## Verification

**Tested in code** (`tests/telegram-port.test.js`, `tests/telegram-publish.test.js`):
- byte-identical generation across runs and time zones;
- the coverage, colour and contrast rules above;
- zip and PNG structure;
- the generated guide's three cloud states (none, awaiting verification, verified) and its Theme Editor and install links;
- every publisher outcome against a mock transport, including first publication, adopting the Theme Editor's theme by its recorded slug, same-identity update, verified no-op, readback mismatch, foreign owner, slug fallback, revoked authorization, flood waits, interrupted writes, rollback and redaction;
- CI job isolation.

**Observed on a device:** the 3.1.0 files on Telegram for Android 12.10.6 and Telegram Desktop 7.2.9 on Windows, through the cloud route, on 2026-10-06 ([acceptance record](evidence/2026-10-06-acceptance.md); `evidence/2026-10-06-import.json` binds it to the exact subject). Each record keeps apart the Theme Editor accepting a file, the link opening a preview, the theme being applied and the theme passing a visual check.

**Current state: experimental.** D-033 changed both files to the 4.0.0 palette, so the 2026-10-06 records remain only as historical evidence of the 3.1.0 files. Any change to the files, tokens, mapping or targets makes a record stale. The port and the cloud link return to `verified` only after the cloud theme is updated with the new files and the owner imports and checks them on each client whose file changed.

**Visual check, on Android and on Telegram Desktop for Windows:**
- **Chats:** the chat list and the unread badges; one chat, with incoming and outgoing bubbles, message text, names, timestamps and links; a reply or quote; the composer and the send button.
- **Other screens:** settings, a profile or dialog, and, on Desktop, hover and selection.
- **Text selection:**
  - selected text in the composer, in an incoming message and in an outgoing message;
  - a selection inside an outgoing code block;
  - a selection in a rich-editor table or caption, if Telegram offers the rich editor.
- **Wallpaper:** the chat wallpaper.

**Expected:** black to red-black surfaces, rose text, muted rose metadata, bright rose names and titles, red and rose accents, near-white only on red fills, and no Telegram blue or cyan.
