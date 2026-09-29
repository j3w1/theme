# Windows compatibility, verification and recovery

## Compatibility boundary

The current candidate is Windows 11 x64 build 26200.9550 with the redesigned
Start layout. `host.json` records exact Explorer, StartDocked, SystemSettings,
ShellExperienceHost and SearchHost versions, plus Start, shell and Client.CBS
package versions. A changed, absent or unreadable input refuses Full mode.

Start detection reads the same three feature-state inputs as pinned Start Menu
Styler 1.7. It does not modify feature flags. Default/unknown/query failure is
unknown; no marketing version or guessed layout grants compatibility. This
read-only native query is coupled to the reviewed adapter pin, not a stable
Windows API guarantee. The active layout was also observed on the candidate
host through Computer Use. This is not a generic XAML-tree inspection claim.

Classic and redesigned Start selectors are separate. Only the detected list is
combined with common semantic resources. The styler is explicitly kept on
Windows' default layout. Classic selectors have no verified host entry yet.
No visibility, navigation, sizing or feature-removal rules are applied.

Apply and Update check before mutation and again before enabling mods. Test
rechecks the fingerprint. The current-user sign-in guard disables managed mods
before deciding whether to enable them. Unknown compatibility leaves them
disabled. Missing-cache or corrupted-cache failures require recovery; do not
assume a failed guard successfully disabled anything.

## What the checks establish

Fixture tests cover transaction rollback, idempotency, JSONC preservation,
profile/layout identity, conflicts, reparse paths, corrupt caches, missing refs,
partial dependency installation and incompatible shell inputs. Native Windows
CI runs the PowerShell wrapper and generated-port tests against isolated state.
They do not change the CI runner's live theme.

The 2026-09-29 development session imported all five pinned mods disabled and
read their generated settings back through the actual Windhawk CLI. It restored
the original disabled Taskbar Styler and removed the other temporary mods.
Lock-screen black-image apply and original-image restore both passed exact byte
readback through the supported WinRT API after correcting the PowerShell await
bridge. The original image remains private in local recovery storage.

Obsidian 1.13.7 displayed the candidate pair in a disposable vault in Reading
View and CM6 Live Preview: prose and bold body text were rose, H1-H6 were
near-white, and nested bold inherited heading/link/quotation colors. Its actual
installed theme pair was backed up and replaced; pair hashes matched and the
appearance preferences were preserved. This observation does not certify all
Obsidian states or the separate Windows shell stylers.

The native Full lifecycle subsequently passed: Apply made 97 managed changes,
repeated Apply returned unchanged, and an explicit Update applied the compact
cursor revision. Test passed before and after that update. Restore Latest
returned to the prior revision and passed Test. Original Restore returned all
eight tracked Terminal/PowerToys settings files to their byte-exact baselines;
reapply of the compact cursor revision then passed Test. Unrelated JSON
properties, existing layouts and assignments were preserved. A transient
Windows file-sharing error on journal replacement interrupted one Restore;
rerunning Restore completed recovery without changing cache digests or backups.
Do not hold the journal open without delete sharing while a lifecycle writes it.

The guard was invoked with the ordinary user/machine PATH through the installed
PowerShell Store alias. It enabled the managed mods with no failures, using the
retained digest- and publisher-verified Node executable. This is an invocation
test of the sign-in command, not evidence from a new Windows sign-in.

Computer Use observed black Settings surfaces and rose labels, the mode menu's
selected state, and visible keyboard focus without changing the selections.
The visible part of Start also had rose labels. This is bounded observation:
full Start/taskbar/Explorer/notification/Quick Settings/PowerToys interaction-state
coverage, native Terminal visual inspection, an actual sign-in, and released
artifact reconciliation remain unverified. The port remains experimental.
Windows owns unsupported Win32 foregrounds, native focus treatments, arbitrary
application title bars and accessibility cursor overrides. Command Palette
offers a tint rather than independent control of every foreground.

The full hosted matrix, including browser shards, consumers, native installer
fixtures, combined evidence and release gate, passed for implementation commit
`4e02fc11dab26cf2cfbe0a0b1b19db8220510a75` in
[the recorded workflow](https://github.com/j3w1/theme/actions/runs/36551129686).
That does not certify the remaining native visual states.

## Recovery

State is under `%LOCALAPPDATA%/j3w1-theme/windows`: immutable `releases`,
`journal.json`, `current.json`, `backups`, `recovery`, `downloads`, and `tools`.
Journals and backups may contain private settings or image bytes. Never attach
them to public issues or commit them. Only redacted outcomes belong in evidence.

1. On failure, retain the state directory. The runtime reverses completed
   changes and reports any unresolved conflicts.
2. Run the installed script with `-Action Restore`. It can find a pending
   transaction even when the first installation did not write `current.json`.
3. If a later managed value differs, Restore preserves it and lists the target.
   Inspect its original, installed and current values locally. To finish the
   rollback, deliberately return that value to the recorded installed value,
   then rerun Restore. Do not replace whole settings files to resolve one key.
4. A stale `bootstrap.lock` or `lifecycle.lock` blocks mutation. Read its recorded
   PID and verify that process is no longer running before removing only that
   stale lock. Never remove a live process's lock.
5. Cache digest failure blocks execution. Restore the exact retained release
   bytes from the same immutable revision; do not edit the digest manifest or
   `verified.json` to bless changed bytes. Recovery performs no network fetch. If a defect in an older adapter prevents
   its refresh or restore, a reviewed fixed revision can read the existing
   journal through an explicit offline source:

   ```powershell
   & ./ports/windows/install.ps1 -Action Restore -SourceRoot . -Revision (git rev-parse HEAD)
   ```

   This validates the fixed release from immutable Git objects, retains the old
   cache and journal history, and applies only the recorded restoration.

Font receipts record pending ownership before files are installed. An interrupted
installation resumes only when already written files still match its receipt.
Unowned or changed destination fonts are conflicts. A compatible Node installation on the ordinary user/machine PATH is reused.
Otherwise Apply downloads the pinned official executable, verifies its digest
and publisher, and retains it under `tools/node` for sign-in and recovery.
The existing PowerShell Store alias is preferred for startup when available,
so an agent runtime cache or a version-specific Store package path is not needed.
Theme restore retains installed shared tools and fonts; automatic dependency removal is unsupported.

## Cursor treatment

The owner revised the native cursor treatment on 2026-09-29 after trying the
first live install: compact black fill with a red outline replaces the larger
rose fill. The generator uses the existing canvas and active-border roles,
shrinks artwork to 75% within each DPI image, and transforms hotspots with it.
All 17 standard roles retain recognizable shapes; no pointer accessibility
setting is changed.

## Required real-machine protocol before promotion

Record the immutable source revision, generated artifact digests, exact host and
app/mod versions, and observed limits. Use nonprivate specimens. Exercise Full
Apply, repeated Apply, explicit Update, Restore Latest, original Restore and
Reapply; check preservation of unrelated Terminal/PowerToys state. Observe each
shell surface in normal, hover, selected, disabled and keyboard-focus states.
Check supported cursor shapes and sizes without changing accessibility settings.
Record the sign-in guard and final installed release reconciliation separately.
Configuration readback alone must never promote the port to verified.
