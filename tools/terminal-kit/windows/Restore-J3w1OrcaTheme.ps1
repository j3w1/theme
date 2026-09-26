<#
.SYNOPSIS
Restores what the kit changed, key by key.

.DESCRIPTION
By default it undoes every apply and update since the last boundary: a restore
that finished its last write and left no kit value applied (any mode; one that
found nothing left to change is recorded as one too). An interrupted restore is
never a boundary, and running the same command again (Restore, Restore
-Latest or Restore -Backup <name>, as the stop message names it) finishes the
job. Per key, the
earliest value recorded since then comes back (removed again if it was absent),
for every key the kit wrote or asked Orca for through the GUI steps; a key the
kit never wrote is left as it is. The kit never sets the font size, so it is
left too, except a size an earlier kit version wrote that nobody changed
since. Apply records what it observes even while Orca runs, so values Orca wrote
later through Import from Ghostty are undone too. When the earliest record
already found the kit's value while config.ghostty held the managed block, the
pre-kit value is unknown: that key is left as it is, the run says so and exits
3. It warns per key about values changed after the kit set them.

config.ghostty loses only the managed block; every byte outside it is kept.
Its earlier bytes come back exactly (or the file is deleted when the kit
created it) only when nothing outside the block changed since. The plan warns
when a file changed since the kit last wrote it. Nothing else in Orca's store
is touched. The current state is backed up first. While Orca runs the store
part is refused (Orca would overwrite it) and the exit code is 2; the Ghostty
file is still restored. -WhatIf exits with the code the real run would.

.PARAMETER Backup
Restore to the state before one backup (its folder name, yyyyMMddTHHmmssZ):
that record and every later one are undone. config.ghostty is left alone when
none of them wrote it.

.PARAMETER Latest
Undo the most recent apply or update (and anything after it). config.ghostty
is left alone when that run did not write it.

.PARAMETER WhatIf
Print the plan and write nothing.

.EXAMPLE
pwsh -NoProfile -File .\Restore-J3w1OrcaTheme.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true, DefaultParameterSetName = 'First')]
param(
  [Parameter(ParameterSetName = 'Named', Mandatory = $true)][string]$Backup,
  [Parameter(ParameterSetName = 'Latest', Mandatory = $true)][switch]$Latest
)

# PowerShell 5.1 must reach this guard, so everything above the module
# import stays 5.1 syntax.
$shellVersion = $PSVersionTable.PSVersion
if ($shellVersion.Major -lt 7 -or ($shellVersion.Major -eq 7 -and $shellVersion.Minor -lt 4)) {
  [Console]::Error.WriteLine('This kit needs PowerShell 7.4 or later. Install PowerShell 7: winget install Microsoft.PowerShell - then run it with pwsh.')
  exit 1
}
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'J3w1Kit.psm1') -Force

try {
  $environment = Get-J3w1Environment
  $kitFiles = Read-J3w1KitFiles -KitRoot (Split-Path -Parent $PSScriptRoot)
  $code = Invoke-J3w1OrcaRestore -Environment $environment -KitFiles $kitFiles -Backup $Backup -Latest:$Latest -PlanOnly:([bool]$WhatIfPreference)
  exit $code
} catch {
  [Console]::Error.WriteLine("error: $($_.Exception.Message)")
  exit 1
}
