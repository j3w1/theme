# Telegram real-import acceptance, 2026-10-06

The owner checked j3w1 on their own devices. This record holds no account data, chats or screenshots.

| | Android | Windows |
| --- | --- | --- |
| Application | Telegram for Android 12.10.6 (7112), store build, arm64-v8a | Telegram Desktop 7.2.9 x64 |
| Device | Owner's phone | Owner's ROG Ally |
| Artifact | `dist/j3w1.attheme`, sha256-SoKDvOr+3AkgLSDO0oFKIzkNHn6PLhJ3ujZo5Ix39Ys= | `dist/j3w1.tdesktop-theme`, sha256-hJpqFP1ooc8qTc4hnNgcLD96onL8pnwcsGSHRZLDUHo= |

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

## Defects found during acceptance and fixed before this record

- **Editor fill.** The Theme Editor filled omitted keys with Telegram defaults. Inherited keys are now written out, and the 77 legacy editor keys are mapped.
- **Android.** Invisible file and voice icons; invisible list section headers.
- **Desktop.**
  - The UNMUTE bar at 2.9:1; the voice-chat add-member label.
  - The two-tone main menu; the rose emoji category strip and transparency checkerboard.
- **Both clients.** Own and other people's bubbles too alike. D-034 adds `color.surface.accent` (`#3d0c0a`): ΔE 24.0.

## Limits

- Opening `j3w1.attheme` or `j3w1.tdesktop-theme` directly (file import) was not exercised; only the cloud route was.
- Linux and macOS Telegram Desktop were not observed; they share the Desktop format.
- Telegram fixes some colours in code; IMPLEMENTATION.md lists them:
  - Android Settings icon squares;
  - white send and mic glyphs;
  - profile action labels;
  - the Desktop trending-sticker "installed" label.
