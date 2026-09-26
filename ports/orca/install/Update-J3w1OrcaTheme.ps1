<#
.SYNOPSIS
Moves the Orca terminal palette to another j3w1/theme release.

.DESCRIPTION
Resolves the release tag to its commit through the GitHub API (or git in
-SourceRoot), then runs that commit's own Get-J3w1Orca.ps1 with -Apply: it
downloads that commit's installer and export into its release folder,
verifies them, shows a before/after diff of every managed value, backs up,
applies and runs the checks. Code and values both come from the tag's
commit. It never follows a branch: "main", "latest" and anything that is not
an exact tag are refused, and so are tags before v3.0.0, which carry no
installer (use Restore, or the terminal kit of that release). A tag read from
-SourceRoot is trusted as the local tag names it, and the run says so.

.PARAMETER Version
The release tag, for example v3.0.0.

.PARAMETER SourceRoot
A local git clone of j3w1/theme that has the tag; files are read from git
objects at the tag's commit, never from the working tree.

.PARAMETER SkipFontCheck
Continue when the terminal font is not installed.

.PARAMETER WhatIf
Print the plan and the before/after diff and write nothing.

.EXAMPLE
pwsh -NoProfile -File .\Update-J3w1OrcaTheme.ps1 -Version v3.0.0 -WhatIf
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
  [Console]::Error.WriteLine('This installer needs PowerShell 7.4 or later. Install PowerShell 7: winget install Microsoft.PowerShell - then run it with pwsh.')
  exit 1
}
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'J3w1Orca.psm1') -Force

try {
  $code = Invoke-J3w1OrcaUpdate -Version $Version -SourceRoot $SourceRoot -PlanOnly:([bool]$WhatIfPreference) -SkipFontCheck:$SkipFontCheck
  exit $code
} catch {
  [Console]::Error.WriteLine("error: $($_.Exception.Message)")
  exit 1
}
