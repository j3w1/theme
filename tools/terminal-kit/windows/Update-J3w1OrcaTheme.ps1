<#
.SYNOPSIS
Moves the Orca terminal palette to another j3w1/theme release.

.DESCRIPTION
Resolves the release tag to its commit through the GitHub API (or git in
-SourceRoot), takes the kit role maps published at that commit (this kit's own
when that commit has none), downloads and verifies that commit's export, shows
a before/after diff of every managed value, backs up, applies through the same
path as Apply-J3w1OrcaTheme.ps1 and runs the checks. It never follows a branch:
"main", "latest" and anything that is not an exact tag are refused.

.PARAMETER Version
The release tag, for example v1.2.0.

.PARAMETER SourceRoot
A local git checkout of j3w1/theme that has the tag; files are read from git
objects at the tag's commit, never from the working tree.

.EXAMPLE
pwsh -NoProfile -File .\Update-J3w1OrcaTheme.ps1 -Version v1.2.0 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)][string]$Version,
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
  $code = Invoke-J3w1OrcaUpdate -KitRoot (Split-Path -Parent $PSScriptRoot) -Version $Version -SourceRoot $SourceRoot -PlanOnly:([bool]$WhatIfPreference) -SkipFontCheck:$SkipFontCheck
  exit $code
} catch {
  [Console]::Error.WriteLine("error: $($_.Exception.Message)")
  exit 1
}
