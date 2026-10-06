# Telegram real-import acceptance, 2026-10-06

The owner checked j3w1 on their own devices. This record holds no account data, chats or screenshots.

| | Android | Windows |
| --- | --- | --- |
| Application | Telegram for Android 12.10.6 (7112), store build, arm64-v8a | Telegram Desktop 7.2.9 x64 |
| Device | Owner's phone | Owner's ROG Ally |
| Artifact | `dist/j3w1.attheme`, sha256-Mwz/btpvJeVTCuZhJat4ivpBOHgcIh1q7sJI7391BwU= (after D-036; first accepted as sha256-SoKDvOr+3AkgLSDO0oFKIzkNHn6PLhJ3ujZo5Ix39Ys=) | `dist/j3w1.tdesktop-theme`, sha256-hJpqFP1ooc8qTc4hnNgcLD96onL8pnwcsGSHRZLDUHo= |

## Route

The cloud route used was Telegram's Theme Editor, with no API application:
1. The owner downloaded each generated file from this repository at the recorded commit.
2. In the Android and TDesktop tabs of the theme `TRhfHcbvZHlOucyc` (title j3w1), the owner used IMPORT FILE, then SAVE AND APPLY THEME.
3. Each client applied `https://t.me/addtheme/TRhfHcbvZHlOucyc` (Android: preview, then Apply; Desktop: Apply this theme, then Keep changes).
4. Later fixes reached both clients as cloud updates, without reapplying the link.

## Observed

1. **Editor import, Android.** The editor's text after import and reload equalled the generated file key for key (829 keys, no Telegram defaults added, no keys dropped). This was compared line by line on earlier revisions. The final revision was imported by the same steps.
2. **Editor import, Desktop.** Equal key for key (541 keys); the editor turned the background image into a cloud wallpaper.
3. **Link applies, Android.** The theme was applied from the install link.
4. **Link applies, Desktop.** The theme was applied from the install link, and persisted across application restarts.
5. **Automatic update, Android.** A cloud save reached the applied client without reapplying the link (within the hourly re-check).
6. **Automatic update, Desktop.** A cloud save reached the applied client on its next start (re-check 10 s after start).
7. **Visual check, both clients.** Chat list, unread badges, chats with incoming and outgoing bubbles, text, names, timestamps, ticks and links, replies, voice and file messages, the composer, attach menus, popup menus, settings, profiles, dialogs, the Desktop main menu, emoji panel and window frame, and the wallpaper. The owner's final verdict was "everything looks good now".

## Re-check after D-036 (text selection), Android

The owner found text selection barely visible in the Android message field. The selection keys had the 12% marquee tint, ΔE 5.2 from the field.
- **The fix.** D-036 gives Android text selection the translucent `interaction.text-selection.tint` (`#911410` at 50%). It changes three Android keys. The Desktop file is byte-identical to the one accepted above.

**What the owner did and saw on Android 12.10.6:**
1. Imported the new `dist/j3w1.attheme` (commit `c140143a`, the same bytes as above) in the Theme Editor's Android tab, by the same steps. The editor text was not compared line by line this time.
2. **Message field.** The selected text shows a clear red tint behind rose text. The owner's verdict: "looks much better".
3. **The owner's own message.** The selection inside an outgoing bubble shows the tint on the normal bubble colour. The screenshot established the bubble colour (`#3d0c0a`). The ΔE 21.5 and 5.53:1 are computed from the composite, not measured on the device.
4. **Final verdict.** In reply to a request to check selection in their own message and in someone else's: "everything looks good now".

The re-check did not cover:
- the selection inside someone else's message (asked for; the owner's reply did not mention it separately);
- the selection in a rich-editor table or caption;
- the selection inside an outgoing code block.

D-036 records the computed figures and limits for these.

## Defects found during acceptance and fixed before this record

- **Editor fill.** The Theme Editor filled omitted keys with Telegram defaults. Inherited keys are now written out, and the 77 legacy editor keys are mapped.
- **Android.** Invisible file and voice icons; invisible list section headers.
- **Desktop.**
  - The UNMUTE bar at 2.9:1; the voice-chat add-member label.
  - The two-tone main menu; the rose emoji category strip and transparency checkerboard.
- **Both clients.** Own and other people's bubbles too alike. D-035 adds `color.surface.accent` (`#3d0c0a`): ΔE 24.0.
- **Android, after the record above.** Text selection barely visible. D-036; see the re-check above.

## Limits

- Opening `j3w1.attheme` or `j3w1.tdesktop-theme` directly (file import) was not exercised; only the cloud route was.
- Linux and macOS Telegram Desktop were not observed; they share the Desktop format.
- Telegram Desktop was not re-observed after D-036, which changes no Desktop key; its file is byte-identical to the one observed.
- While a selection lasts on Android, links, some code colours and text the tint is painted over fall below 4.5:1 (D-036 limits).
- Telegram fixes some colours in code; IMPLEMENTATION.md lists them:
  - Android Settings icon squares;
  - white send and mic glyphs;
  - profile action labels;
  - the Desktop trending-sticker "installed" label.
