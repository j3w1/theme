<#
.SYNOPSIS
Checks the applied Orca terminal palette and renders the specimen.

.DESCRIPTION
Renders specimen.json with ANSI SGR (slots) and 24-bit colour (tokens and
Claude Code roles) with the expected hex and contrast beside each slot, then
checks the Ghostty block, later Ghostty overrides, every managed Orca setting,
the preserved keys against the last apply and the owner's expected
preferences. Each check prints PASS, FAIL, WARN or SKIP with the observed
value. Exit code 0 only when nothing FAILs. The documented deviations and the
use-and-report disclosures are printed every time.

.PARAMETER SourceRoot
A local checkout of j3w1/theme to read the export from instead of the cache
or the network.

.PARAMETER NoSpecimen
Checks only.
#>
[CmdletBinding()]
param(
  [string]$SourceRoot,
  [switch]$NoSpecimen
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
  [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
  # The specimen is the point of this script: draw it even when output is
  # redirected or NO_COLOR is set.
  $PSStyle.OutputRendering = 'Ansi'
  $context = New-J3w1VerifyContext -KitRoot (Split-Path -Parent $PSScriptRoot) -SourceRoot $SourceRoot
  $fails = Invoke-J3w1OrcaVerify -Context $context -NoSpecimen:$NoSpecimen
  if ($fails -gt 0) { exit 1 }
  exit 0
} catch {
  [Console]::Error.WriteLine("error: $($_.Exception.Message)")
  exit 1
}
