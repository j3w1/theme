<#
.SYNOPSIS
Applies the j3w1 approved default terminal palette to the Orca desktop client.

.DESCRIPTION
Takes every value from the commit these scripts came from: a release folder
that Get-J3w1Orca.ps1 downloaded (release.json names the commit), or git
objects at HEAD when it runs from a clone, never files you have edited.
tokens.resolved.json must equal its entry in digests.json from the same
commit; a release folder is verified again on every run. Then it plans and
serialises every change, backs up, writes the managed block of
%APPDATA%\ghostty\config.ghostty and - only while no Orca process runs - the
managed keys of Orca's settings store. Every run that writes anything records
the value of every managed key as it found it, so Restore knows the pre-theme
values even when Orca writes the theme's values later through Import from
Ghostty. With Orca running it writes the Ghostty block only and prints the
three Orca steps. A second run with nothing to change reports "no changes"
and makes no backup. Undo with Restore-J3w1OrcaTheme.ps1; check with
Test-J3w1OrcaTheme.ps1.

.PARAMETER SkipFontCheck
Continue when the terminal font (SauceCodePro NFM) is not installed.

.PARAMETER WhatIf
Print the plan and write nothing (no backup, no state).

.EXAMPLE
pwsh -NoProfile -File .\Apply-J3w1OrcaTheme.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [switch]$SkipFontCheck
)

# PowerShell 5.1 must reach this guard, so everything above the module
# import stays 5.1 syntax.
$shellVersion = $PSVersionTable.PSVersion
if ($shellVersion.Major -lt 7 -or ($shellVersion.Major -eq 7 -and $shellVersion.Minor -lt 4)) {
  [Console]::Error.WriteLine('This installer needs PowerShell 7.4 or later. Install PowerShell 7: winget install Microsoft.PowerShell - then run it with pwsh.')
  exit 1
}
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'J3w1Orca.psm1') -Force

try {
  $context = New-J3w1Context -KitRoot (Join-Path $PSScriptRoot '../../..')
  [void](Invoke-J3w1OrcaApply -Context $context -Operation 'apply' -PlanOnly:([bool]$WhatIfPreference) -SkipFontCheck:$SkipFontCheck)
  exit 0
} catch {
  [Console]::Error.WriteLine("error: $($_.Exception.Message)")
  exit 1
}
