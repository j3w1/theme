<#
.SYNOPSIS
Applies the j3w1 approved default terminal palette to the Orca desktop client.

.DESCRIPTION
Reads the theme export pinned in ../kit.json (tag verified against its commit,
tokens.resolved.json verified against digests.json), backs up every file it is
about to change, writes the managed block of %APPDATA%\ghostty\config.ghostty
and - only while no Orca process runs - the managed keys of Orca's settings
store. With Orca running it writes the Ghostty block only and prints the GUI
steps. A second run with nothing to change reports "no changes" and makes no
backup. Undo with Restore-J3w1OrcaTheme.ps1; check with Test-J3w1OrcaTheme.ps1.

.PARAMETER SourceRoot
A local checkout of j3w1/theme to read the export from instead of the network.
Digests are still verified.

.PARAMETER SkipFontCheck
Continue when the terminal font (SauceCodePro NFM) is not installed.

.EXAMPLE
pwsh -NoProfile -File .\Apply-J3w1OrcaTheme.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$SourceRoot,
  [switch]$SkipFontCheck
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
  $planOnly = [bool]$WhatIfPreference
  $context = New-J3w1Context -KitRoot (Split-Path -Parent $PSScriptRoot) -SourceRoot $SourceRoot -NoCache:$planOnly
  [void](Invoke-J3w1OrcaApply -Context $context -Operation 'apply' -PlanOnly:$planOnly -SkipFontCheck:$SkipFontCheck)
  exit 0
} catch {
  [Console]::Error.WriteLine("error: $($_.Exception.Message)")
  exit 1
}
