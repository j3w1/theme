# Historical excerpts — j3w1/1w3j @ `98413159d17e7e77e301b21fb688262e8b16d676`

Quoted from the pinned revision (fetched with `gh api` on 2026-09-06). These are
evidence of origin, not rules; the adopted values live in `tokens/`. Line
numbers refer to the files at that revision.

## `config/Xresources` — the canonical palette (lines 34–57)

```
*background:            #0C0909
*foreground:            #E99499
*cursorColor:           #E99499
*pointerColorBackground:#A3676B
*pointerColorForeground:#E99499
!! for color references look at Intellij idea Settings>Editor>Color Schemes>Console Colors
*color0:                #0C0909
*color8:                #7D1310
*color1:                #C81A1A
*color9:                #AB1612
*color2:                #BD787D
*color10:               #AD2721
*color3:                #D4868B
*color11:               #B37175
*color4:                #8C1212
*color12:               #871F19
*color5:                #F73f35
*color13:               #E82132
*color6:                #9E474A
*color14:               #E0292F
*color7:                #FFA2A7
*color15:               #A3676B
```

The author's slot annotations (lines 17–32) record what each slot rendered on
the workstation. They seed the `code.syntax.*` roles and explain the profile
`heritage-ansi`:

```
!! color0  dirs fg drwxrwxrwt, error color fg, agnoster pwd fg and error arrow bg
!! color8  Terminal bg? | on vim, line numbers, shebang, comments
!! color1  on vim system commands, binaries | specific case: highlighting color for \033[31m (on init.sh output f.e.)
!! color9  compressed files fg | on vim, declarations and assignments (function names, variable names, including its bracket or parenthesis)
!! color2  dirs bg dwrxrwxrwx | strings in vim
!! color10 files fg (-rwxrwxrwx/-rwxr-xr-x) & links destination location (after the arrow) | no vim colors sighted
!! color3  on vim parenthesis, symbols, commas | agnoster git plugin arrow e.g. "master arrow"
!! color11 files in /dev (crw-------)
!! color4  dirs fg drwxrwxrwx | agnoster pwd arrow bg
!! color12 dirs fg drwxr-xr-x/drwx------ | no vim color yet
!! color5  on vim if [[!]]then else fi, do done, case in esac color foreground
!! color13 image files
!! color6  audio files fg
!! color14 filenames of links fg (before the arrow)
!! color7  on vim function calls, file locations, quotes, @=&%*.~/;cat<<EOF symbols-operators | on gtk the window background
!! color15 still no color sighted
```

Font: `Source Code Pro for Powerline`, medium, `pixelsize=13`, with
`TerminessTTFNerdFontMono` and `DejaVuSansMono Nerd Font Mono` fallbacks;
`URxvt*letterSpace: -1`; `Xft.hintstyle: hintslight`.

## `config/i3/config` — geometry and colour classes

```
default_border pixel 1                       (line 11)
font xft:Source Code Pro for Powerline 12    (line 28)
gaps inner 14                                (line 481)
gaps outer -2                                (line 482)
smart_gaps on                                (line 490)
smart_borders on                             (line 494)
```

Bar colours (lines 445–454; `$term_*` are read from Xresources):

```
background $term_background
statusline $term_foreground
separator  $term_color2
#                   border           backgr.           text
focused_workspace   $term_color0     $term_color1      $term_background
active_workspace    $term_color1     $term_background  $term_color6
inactive_workspace  $term_color8     $term_background  $term_foreground
binding_mode        $term_foreground $term_color1      $term_foreground
urgent_workspace    $term_color0     $term_foreground  $term_color0
```

Client colours (lines 468–474):

```
# class                  border         backgr.          text             indic.        child_border
client.focused           $term_color14  $term_background $term_foreground $term_color7  $term_color4
client.focused_inactive  $term_color6   $term_color8     $term_color15    $term_color3  $term_color12
client.unfocused         $term_color1   $term_color0     $term_color8     #fd12df       $term_color14
client.urgent            $term_color7   $term_color8     $term_foreground #fd12df       $term_color7
client.placeholder       #13FDDF        #dffd13          $term_color7     #fd12df       $term_color5
client.background        $term_background
```

The three garish literals (`#fd12df`, `#13FDDF`, `#dffd13`) are debugging
markers for unset indicators, not palette members.

## `config/i3/i3status.conf` (lines 12–14)

```
color_good = "#FFA2A7"
color_bad = "#A3676B"
color_degraded = "#C81A1A"
```

## `config/config/dunst/dunstrc`

```
frame_width = 1                 (line 2)
frame_color = "#AE1914"         (line 3)
separator_color = #e99499       (line 137)
[urgency_low]      background = "#a3676b"  foreground = "#0C0909"   (lines 184–185)
[urgency_normal]   background = "#0C0909"  foreground = "#e99499"   (lines 189–190)
[urgency_critical] background = "#DC282E"  foreground = "#F9FAF9"   (lines 194–195)
```

Lines 277–290 keep upstream sample rules for weechat (`#0033bb`, `#FF5C47`,
`#D53B84`); they are not part of the palette.

## `config/dmenurc` (lines 7–19)

```
DMENU_FN="SourceCodePro-12"
DMENU_NB="#0C0909"
DMENU_NF="#E99499"
DMENU_SB="#630F0D"
DMENU_SF="#E99499"
```

## Other historical ports in the same repository

Catalogued in `references/catalogue.json` and not quoted here: the gedit
GtkSourceView scheme (`config/config/gedit/styles/1w3j.xml`, a Solarized
slot structure with every hue filled by a red), the IntelliJ scheme
(`config/intellij/config/colors/1w3j-theme.icls`, Material Darker base with
red chrome, console, gutter and selection), tmux, cVim, Surfingkeys and a
GitHub userstyle. Two non-canonical variants also exist there: the raw pywal
ramp (`scripts/colors.sh`) and the pywal-cache variant `#0C0A09` / `#D09899`
used by tmux and the IntelliJ Material UI config. Only the Xresources palette
is normative.
