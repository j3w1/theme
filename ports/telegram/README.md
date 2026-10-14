# j3w1 for Telegram

For the official Telegram for Android and Telegram Desktop (Windows, Linux and macOS).

<!-- install:start -->
**Cloud installation: awaiting owner verification.** Until then, install from the files below.

## Install from files

### Android

1. Download [j3w1.attheme](https://j3w1.github.io/theme/ports/telegram/j3w1.attheme) and open it in Telegram (or send it to your Saved Messages and tap it there).
2. Tap **Apply**.

### Desktop

1. Download [j3w1.tdesktop-theme](https://j3w1.github.io/theme/ports/telegram/j3w1.tdesktop-theme) and open it with Telegram Desktop.
2. Click **Apply this theme**, then **Keep changes**.

A theme installed from a file never updates by itself.

## Update the cloud theme with Telegram's Theme Editor

For the theme owner. No Telegram API application is needed.

1. Download both files above.
2. Open the [j3w1 Theme Editor](https://themes.contest.com/theme/TRhfHcbvZHlOucyc?format=android) and log in with your Telegram account.
3. **Android** tab: **IMPORT FILE**, choose `j3w1.attheme`, then **SAVE AND APPLY THEME**.
4. **TDesktop** tab: **IMPORT FILE**, choose `j3w1.tdesktop-theme`, then **SAVE AND APPLY THEME**.
5. Check the install link on Android and on Telegram Desktop, as [Publishing](PUBLISHING.md#check-the-install-link) describes.
<!-- install:end -->

**Experimental:** the 4.0.0 files await a new import check on both clients ([Verification](IMPLEMENTATION.md#verification)). Telegram for iOS, Telegram for macOS (App Store), Telegram Web and Telegram X read neither file.

To stop using j3w1, choose another theme in Telegram's chat or appearance settings.

## Troubleshooting

- **The link opens a web page.** Open it on a device with Telegram installed, or paste it into any Telegram chat (Saved Messages works) and tap it there.
- **Colours change at night on Android.** Auto-night mode switched to its night theme. Pick j3w1 for night too, or turn auto-night off, in Telegram's chat settings.
- **One chat looks different.** That chat has its own chat theme; reset it from the chat's menu.
- **Desktop says "Sorry, this theme doesn't include a version for Telegram Desktop."** The cloud theme lacks its Desktop document. The owner imports `j3w1.tdesktop-theme` in the Theme Editor's TDesktop tab and saves (or runs `npm run telegram:publish`). The file install works meanwhile.
- **Android says "Sorry, this color theme doesn't support your device yet."** The cloud theme lacks its Android document. The owner imports `j3w1.attheme` in the Android tab and saves.
- **The theme reverted after 15 seconds on Desktop.** Click **Keep changes** after applying a file.

[Publishing](PUBLISHING.md), including the optional automatic publisher · [Implementation](IMPLEMENTATION.md)
