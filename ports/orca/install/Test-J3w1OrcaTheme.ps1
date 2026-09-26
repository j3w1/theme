<#
.SYNOPSIS
Checks the applied Orca terminal palette and renders the specimen.

.DESCRIPTION
Renders specimen.json with ANSI SGR (slots) and 24-bit colour (tokens) with
the expected hex and contrast beside each slot, then checks the Ghostty
block, later Ghostty overrides, every managed Orca setting, the preserved
keys against the last apply and the owner's expected preferences. Each check
prints PASS, FAIL, WARN or SKIP with the observed value. It checks the commit
the last apply installed: from its release folder when that is not the
folder this script sits in, and against the export digest the last apply
recorded. The terminal font size is yours and the installer never sets it: a
size changed since the last apply is a WARN, and the Ghostty block is
compared without its font-size line, which is absent when the machine has no
size. Exit code 0 only when nothing FAILs. The documented deviations and the
use-and-report disclosures are printed every time.

.PARAMETER NoSpecimen
Checks only.
#>
[CmdletBinding()]
param(
  [switch]$NoSpecimen
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
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  # The specimen is the point of this script: draw it even when output is
  # redirected or NO_COLOR is set.
  $PSStyle.OutputRendering = 'Ansi'
  $context = New-J3w1VerifyContext -KitRoot (Join-Path $PSScriptRoot '../../..')
  $fails = Invoke-J3w1OrcaVerify -Context $context -NoSpecimen:$NoSpecimen
  if ($fails -gt 0) { exit 1 }
  exit 0
} catch {
  [Console]::Error.WriteLine("error: $($_.Exception.Message)")
  exit 1
}
