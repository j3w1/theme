#!/bin/sh
# Reviewed j3w1 installer for an Obsidian vault on Android device storage,
# run from Termux. It replaces only <vault>/.obsidian/themes/j3w1 and never
# touches notes, plugins, other themes or other vault configuration, provided
# nothing else changes the vault's folders while it runs. It checks them
# between steps and stops if it notices they moved; shell code cannot rule out
# every concurrent change. Read ANDROID.md first and keep Obsidian (and any app
# that syncs the vault) closed until it finishes.
#
#   sh install-android.sh --vault "$HOME/storage/shared/Documents/MyVault"

set -eu

base='https://j3w1.github.io/theme/ports/obsidian/'
names='manifest.json theme.css'

die() {
    printf 'j3w1: %s\n' "$*" >&2
    exit 1
}

usage() {
    printf '%s\n' 'Usage: sh install-android.sh --vault PATH' \
        'Installs the j3w1 theme pair into PATH/.obsidian/themes/j3w1.' \
        'PATH must be an existing vault on device storage that already contains .obsidian.'
}

vault=''
while [ "$#" -gt 0 ]; do
    case $1 in
        --vault)
            [ "$#" -ge 2 ] || die 'The --vault option needs a path.'
            vault=$2
            shift 2
            ;;
        -h | --help)
            usage
            exit 0
            ;;
        *)
            usage >&2
            die "Unknown argument: $1"
            ;;
    esac
done
if [ -z "$vault" ]; then
    usage >&2
    die 'Missing --vault PATH.'
fi

for tool in curl jq mktemp; do
    command -v "$tool" >/dev/null 2>&1 || die "$tool is required but was not found. In Termux run: pkg install curl jq"
done

vault=$(CDPATH='' cd -- "$vault" 2>/dev/null && pwd -P) ||
    die "Vault folder not found or not readable: $vault (Termux cannot reach vaults in Obsidian's app storage; see ANDROID.md)"
config="$vault/.obsidian"
if [ -L "$config" ] || [ ! -d "$config" ]; then
    die "Not an existing Obsidian vault configuration: $config"
fi
themes="$config/themes"
theme="$themes/j3w1"

download=''
staging=''
backup=''
created_themes=''
keep=''
aside=''

# True while .obsidian and themes are real folders, not links, and this run's
# own hidden folders are still where it made them: a themes folder that was
# moved or replaced, even by another real folder, fails this.
confined() {
    [ ! -L "$config" ] && [ -d "$config" ] && [ ! -L "$themes" ] && [ -d "$themes" ] &&
        { [ -z "$staging" ] || [ -d "$staging" ]; } && { [ -z "$backup" ] || [ -d "$backup" ]; }
}

say() {
    printf 'j3w1: %s\n' "$*" >&2
}

# Removes only folders this run created with mktemp inside the themes folder.
remove_owned() {
    case $1 in
        "$themes"/.j3w1-install-* | "$themes"/.j3w1-backup-*)
            if [ -e "$1" ] && ! rm -rf -- "$1"; then
                say "could not remove $1; delete it after closing Obsidian."
            fi
            ;;
    esac
}

# True when the staged folder became exactly themes/j3w1. If another app
# created j3w1 first, mv nests the staged folder inside it instead.
installed() {
    [ ! -e "$staging" ] && [ ! -L "$theme" ] && [ -d "$theme" ] &&
        [ ! -e "$theme/${staging##*/}" ] &&
        [ -f "$theme/manifest.json" ] && [ -f "$theme/theme.css" ]
}

cleanup() {
    status=$?
    set +e
    if [ -n "$download" ]; then rm -rf -- "$download"; fi
    # Nothing under themes is removed once its folders moved: a path could now
    # lead outside the vault.
    if [ -z "$keep" ] && [ -n "$staging$backup" ] && ! confined; then keep=1; fi
    # A stop before the old folder moved aside leaves nothing to recover: the
    # previous theme is still in place, so only this run's own folders go.
    if [ -n "$keep" ] && [ -z "$aside" ] && [ -n "$backup" ] && [ ! -e "$backup/j3w1" ] &&
        [ ! -L "$backup/j3w1" ] && [ -d "$theme" ] && [ ! -L "$theme" ] && confined; then
        keep=''
    fi
    if [ -n "$keep" ]; then
        # The only place recovery paths are printed: a path is named only if it
        # exists now, and advice follows what is on disk. Nothing here deletes.
        say 'Recovery copies were kept; nothing was deleted.'
        previous=''
        if [ -n "$backup" ] && [ -e "$backup/j3w1" ]; then previous="$backup/j3w1"; fi
        fresh=''
        if [ -n "$staging" ] && [ -e "$staging" ]; then fresh=$staging; fi
        if [ -n "$previous$fresh" ]; then
            say 'Keep recovery copies at these paths until you have checked them:'
            if [ -n "$previous" ]; then say "previous theme: $previous"; fi
            if [ -n "$fresh" ]; then say "new pair: $fresh"; fi
        fi
        if [ -n "$previous" ]; then
            if [ ! -L "$theme" ] && [ -f "$theme/manifest.json" ] && [ -f "$theme/theme.css" ]; then
                say 'j3w1 holds a complete pair; delete the previous copy once Obsidian shows the theme.'
            else
                say 'Before starting Obsidian, move whatever is at j3w1 to a folder outside .obsidian/themes and check it, then move the previous theme folder back to j3w1.'
            fi
        elif [ -n "$backup" ]; then
            say 'The previous theme is no longer where the helper left it; the themes folder may have been moved or replaced. Find the hidden .j3w1-backup- and .j3w1-install- folders and check both copies before starting Obsidian.'
        fi
    else
        if [ -n "$staging" ]; then remove_owned "$staging"; fi
        if [ -n "$backup" ]; then remove_owned "$backup"; fi
        if [ -n "$created_themes" ] && [ "$status" -ne 0 ]; then rmdir -- "$themes" 2>/dev/null; fi
    fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

download=$(mktemp -d "${TMPDIR:-/tmp}/j3w1-download-XXXXXXXX") ||
    die 'Could not create a temporary download folder.'
for name in $names; do
    curl -fsSL --proto '=https' --proto-redir '=https' --tlsv1.2 -o "$download/$name" "$base$name" ||
        die "Download failed: $base$name"
done

jq -e -s 'length == 1 and (.[0] | .name == "j3w1"
    and (.version | type == "string" and test("^[0-9]+\\.[0-9]+\\.[0-9]+$"))
    and (.minAppVersion | type == "string" and test("^[0-9]+\\.[0-9]+\\.[0-9]+$")))' \
    "$download/manifest.json" >/dev/null 2>&1 ||
    die 'Downloaded manifest has an unexpected name or invalid version/minAppVersion.'
version=$(jq -r '.version' "$download/manifest.json")
css="$download/theme.css"
[ -s "$css" ] || die 'Downloaded CSS is empty.'
header=''
IFS= read -r header <"$css" || :
[ "$header" = "/* j3w1 theme $version, default profile, for Obsidian." ] ||
    die 'Downloaded CSS header does not match the manifest version.'

# Everything above only read the vault. Refuse anything unexpected before the
# first change: the whole j3w1 folder is swapped, so it may hold only the pair.
if [ -L "$themes" ]; then
    die "Themes path is a symbolic link: $themes"
elif [ -e "$themes" ] && [ ! -d "$themes" ]; then
    die "Themes path is not a directory: $themes"
fi
existing=0
if [ -L "$theme" ]; then
    die "Theme path is a symbolic link: $theme"
elif [ -d "$theme" ]; then
    for entry in "$theme"/* "$theme"/.[!.]* "$theme"/..?*; do
        if [ ! -e "$entry" ] && [ ! -L "$entry" ]; then continue; fi
        case ${entry##*/} in
            manifest.json | theme.css)
                if [ -L "$entry" ] || [ ! -f "$entry" ]; then die "Theme artifact is not a file: $entry"; fi
                existing=$((existing + 1))
                ;;
            *) die "Theme folder has an unexpected entry; move it out of $theme first: ${entry##*/}" ;;
        esac
    done
    [ "$existing" -ne 1 ] || die 'Existing theme has only one of the two files; repair it before updating.'
elif [ -e "$theme" ]; then
    die "Theme path is not a directory: $theme"
fi

moved='The vault folders changed during installation; stopping. Nothing was deleted.'
if [ ! -d "$themes" ]; then
    mkdir -- "$themes" || die "Could not create $themes"
    created_themes=1
fi
confined || die "$moved"
staging=$(mktemp -d "$themes/.j3w1-install-XXXXXXXX") || die "Could not create a staging folder in $themes"
chmod 755 "$staging" 2>/dev/null || :
for name in $names; do
    cp -- "$download/$name" "$staging/$name" || die "Could not stage $name."
done

# Both folders are on one filesystem, so each move is a rename. From here an
# interruption keeps every copy instead of deleting the only one, and success
# is claimed only once the pair is exactly in j3w1.
nested="$theme/${staging##*/}"
changed='The theme folder changed during replacement; nothing was deleted.'
if [ -d "$theme" ]; then
    backup=$(mktemp -d "$themes/.j3w1-backup-XXXXXXXX") || die "Could not create a backup folder in $themes"
    confined || die "$moved"
    keep=1
    if ! mv -- "$theme" "$backup/j3w1"; then
        if [ -d "$theme" ] && [ ! -e "$backup/j3w1" ]; then
            keep=''
            die 'Could not move the existing theme aside; nothing was replaced.'
        fi
        die 'Could not move the existing theme aside completely.'
    fi
    aside=1
    confined || die "$moved"
    if [ -e "$theme" ] || [ -L "$theme" ]; then die "$changed"; fi
    if ! mv -- "$staging" "$theme"; then
        if [ ! -e "$theme" ] && [ ! -L "$theme" ] && mv -- "$backup/j3w1" "$theme"; then
            keep=''
            die 'Replacement failed; previous theme pair restored.'
        fi
        die 'Replacement failed and restoration failed.'
    fi
    if ! installed; then
        if [ -e "$nested" ]; then staging=$nested; fi
        die "$changed"
    fi
    staging=''
    keep=''
else
    confined || die "$moved"
    if [ -e "$theme" ] || [ -L "$theme" ]; then die "$changed"; fi
    mv -- "$staging" "$theme" || die 'Installation failed; no theme was installed.'
    if ! installed; then
        keep=1
        if [ -e "$nested" ]; then staging=$nested; fi
        die "$changed The new pair was not installed."
    fi
    staging=''
fi
printf 'Installed j3w1 %s at %s. Restart Obsidian and choose the Dark base scheme.\n' "$version" "$theme"
