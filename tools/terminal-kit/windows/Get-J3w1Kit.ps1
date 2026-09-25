<#
.SYNOPSIS
Downloads the j3w1 terminal kit for Orca at one exact commit.

.DESCRIPTION
Fetches kit.json, the role maps, specimen.json and the Windows scripts from
raw.githubusercontent.com at the given commit of j3w1/theme into
%LOCALAPPDATA%\j3w1-theme\kit\<revision>\ and prints the next command. Only a
full 40-character commit SHA is accepted: a branch, a tag or "latest" can
move, a commit cannot.

Run it without saving it first:

  & ([scriptblock]::Create((Invoke-RestMethod https://raw.githubusercontent.com/j3w1/theme/<revision>/tools/terminal-kit/windows/Get-J3w1Kit.ps1))) -Revision <revision>

.PARAMETER Revision
The kit commit (40 lowercase hex characters).

.PARAMETER SourceRoot
Copy from a local checkout's working tree instead of the network (offline use
and tests).
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Revision,
  [string]$SourceRoot
)

# This script runs before the kit exists locally, so it does not import the
# module; it repeats the version guard and the test seam in miniature. It is
# also run as a scriptblock in the owner's session, so it never calls exit
# (that would close the session): failures throw, which gives exit code 1
# under -File.
$shellVersion = $PSVersionTable.PSVersion
if ($shellVersion.Major -lt 7 -or ($shellVersion.Major -eq 7 -and $shellVersion.Minor -lt 4)) {
  throw 'This kit needs PowerShell 7.4 or later. Install PowerShell 7: winget install Microsoft.PowerShell - then run it with pwsh.'
}
$ErrorActionPreference = 'Stop'

$repository = 'j3w1/theme'
$prefix = 'tools/terminal-kit'
$files = @(
  'kit.json',
  'specimen.json',
  'roles/terminal.json',
  'roles/claude-code.json',
  'roles/codex.json',
  'windows/README.md',
  'windows/J3w1Kit.psm1',
  'windows/Get-J3w1Kit.ps1',
  'windows/Apply-J3w1OrcaTheme.ps1',
  'windows/Update-J3w1OrcaTheme.ps1',
  'windows/Test-J3w1OrcaTheme.ps1',
  'windows/Restore-J3w1OrcaTheme.ps1'
)

if ($Revision -cnotmatch '^[0-9a-f]{40}$') {
  throw "-Revision must be a full 40-character lowercase commit SHA; '$Revision' is refused (branches, tags and 'latest' can move)."
}
$testRoot = $env:J3W1_KIT_TEST_ROOT
if (-not [string]::IsNullOrWhiteSpace($testRoot)) {
  if ([string]::IsNullOrWhiteSpace($SourceRoot)) { throw 'Test seam active (J3W1_KIT_TEST_ROOT): the network is disabled, pass -SourceRoot.' }
  $localAppData = Join-Path (Join-Path $testRoot 'AppData') 'Local'
} else {
  if (-not $IsWindows) { throw 'This kit configures the Orca desktop client on Windows; run it there with PowerShell 7 (pwsh).' }
  $localAppData = $env:LOCALAPPDATA
}
$target = (Join-Path $localAppData "j3w1-theme/kit/$Revision").Replace('/', [System.IO.Path]::DirectorySeparatorChar)

$client = $null
if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
  $client = [System.Net.Http.HttpClient]::new()
  $client.Timeout = [TimeSpan]::FromSeconds(60)
  $client.DefaultRequestHeaders.UserAgent.ParseAdd('j3w1-terminal-kit')
}
try {
  foreach ($file in $files) {
    $path = "$prefix/$file"
    if ($null -eq $client) {
      $local = Join-Path $SourceRoot $path
      if (-not (Test-Path -LiteralPath $local -PathType Leaf)) { throw "Missing $path under -SourceRoot $SourceRoot." }
      $bytes = [System.IO.File]::ReadAllBytes($local)
    } else {
      $url = "https://raw.githubusercontent.com/$repository/$Revision/$path"
      $response = $client.GetAsync($url).GetAwaiter().GetResult()
      if ([int]$response.StatusCode -eq 404 -and $file -eq 'kit.json') { throw "Commit $Revision of $repository has no $path; is it a kit commit?" }
      if (-not $response.IsSuccessStatusCode) { throw "GET $url failed: HTTP $([int]$response.StatusCode)" }
      $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    }
    $destination = (Join-Path $target $file).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $folder = Split-Path -Parent $destination
    if (-not (Test-Path -LiteralPath $folder)) { [void](New-Item -ItemType Directory -Path $folder -Force) }
    [System.IO.File]::WriteAllBytes($destination, $bytes)
    Write-Host "  $file"
  }
} finally {
  if ($null -ne $client) { $client.Dispose() }
}

$kit = Get-Content -LiteralPath (Join-Path $target 'kit.json') -Raw | ConvertFrom-Json -AsHashtable
if ($kit.id -ne 'j3w1-terminal-kit') { throw "The downloaded kit.json is not the j3w1 terminal kit (id '$($kit.id)')." }
$windows = Join-Path $target 'windows'
Write-Host ''
Write-Host "Kit $Revision is in $target"
Write-Host "It pins $($kit.theme.name) $($kit.theme.version) ($($kit.theme.ref) @ $($kit.theme.revision))."
Write-Host 'Next (preview first, then apply, then check):'
Write-Host "  pwsh -NoProfile -File `"$(Join-Path $windows 'Apply-J3w1OrcaTheme.ps1')`" -WhatIf"
Write-Host "  pwsh -NoProfile -File `"$(Join-Path $windows 'Apply-J3w1OrcaTheme.ps1')`""
Write-Host "  pwsh -NoProfile -File `"$(Join-Path $windows 'Test-J3w1OrcaTheme.ps1')`""
