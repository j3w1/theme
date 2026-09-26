<#
.SYNOPSIS
Downloads the j3w1 theme installer for Orca at one exact commit, and with
-Apply installs it.

.DESCRIPTION
Fetches ports/orca/host.json, the installer scripts, the specimen and the
export (exports/tokens.resolved.json and exports/digests.json) from
raw.githubusercontent.com at the given commit of j3w1/theme into
%LOCALAPPDATA%\j3w1-theme\orca\releases\<revision>\, checks the export
against digests.json from the same commit, and records the folder in
release.json. Only a full 40-character commit SHA is accepted: a branch, a
tag or "latest" can move, a commit cannot.

With -Apply it then applies that folder (Orca's settings only while Orca is
fully closed; otherwise the Ghostty block and the three Orca steps) and runs
the checks. Without -Apply it prints the next commands.

Run it without saving it first:

  & ([scriptblock]::Create((Invoke-RestMethod https://raw.githubusercontent.com/j3w1/theme/<revision>/ports/orca/install/Get-J3w1Orca.ps1))) -Revision <revision> -Apply

Update-J3w1OrcaTheme.ps1 runs the Get-J3w1Orca.ps1 of the release it moves
to, with -Revision, -Apply, -Update, -Tag and optionally -SourceRoot,
-SkipFontCheck and -WhatIf; every release keeps those parameters.

.PARAMETER Revision
The commit (40 lowercase hex characters).

.PARAMETER SourceRoot
Copy from a local git clone of j3w1/theme instead of the network (offline
use): the files are read from git objects at -Revision, never from the
working tree, and a clone without that commit is refused.

.PARAMETER Apply
Apply the downloaded release and run the checks.

.PARAMETER SkipFontCheck
With -Apply: continue when the terminal font is not installed.

.PARAMETER Update
With -Apply: record the run as an update and show a before/after diff of
every managed value (Update-J3w1OrcaTheme.ps1 passes it).

.PARAMETER Tag
The release tag that names -Revision, when known (Update-J3w1OrcaTheme.ps1
passes it); the export must carry that version.

.PARAMETER WhatIf
Download into a temporary folder, print the apply plan, write nothing and
delete the folder.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)][string]$Revision,
  [string]$SourceRoot,
  [switch]$Apply,
  [switch]$SkipFontCheck,
  [switch]$Update,
  [string]$Tag
)

# This script runs before the installer exists locally, so it cannot import
# the module until it has downloaded it; it repeats the version guard and
# the test seam in miniature. It is also run as a scriptblock in the owner's
# session, so it never calls exit (that would close the session): failures
# throw, which gives exit code 1 under -File.
$shellVersion = $PSVersionTable.PSVersion
if ($shellVersion.Major -lt 7 -or ($shellVersion.Major -eq 7 -and $shellVersion.Minor -lt 4)) {
  throw 'This installer needs PowerShell 7.4 or later. Install PowerShell 7: winget install Microsoft.PowerShell - then run it with pwsh.'
}
$ErrorActionPreference = 'Stop'

$repository = 'j3w1/theme'
# Every file the installer needs, as repository paths. tests/orca-install.test.js
# checks that this list names every file under ports/orca/install.
$files = @(
  'ports/orca/README.md',
  'ports/orca/host.json',
  'ports/orca/dist/config.ghostty',
  'ports/orca/install/Get-J3w1Orca.ps1',
  'ports/orca/install/J3w1Orca.psm1',
  'ports/orca/install/Apply-J3w1OrcaTheme.ps1',
  'ports/orca/install/Test-J3w1OrcaTheme.ps1',
  'ports/orca/install/Update-J3w1OrcaTheme.ps1',
  'ports/orca/install/Restore-J3w1OrcaTheme.ps1',
  'ports/orca/install/specimen.json',
  'exports/tokens.resolved.json',
  'exports/digests.json'
)
$tokensPath = 'exports/tokens.resolved.json'
$digestsPath = 'exports/digests.json'

if ($Revision -cnotmatch '^[0-9a-f]{40}$') {
  throw "-Revision must be a full 40-character lowercase commit SHA; '$Revision' is refused (branches, tags and 'latest' can move)."
}
if (-not [string]::IsNullOrWhiteSpace($Tag) -and $Tag -notmatch '^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$') { throw "-Tag must be a release tag such as v3.0.0; '$Tag' is refused." }
$planOnly = [bool]$WhatIfPreference
$testRoot = $env:J3W1_KIT_TEST_ROOT
$worktree = $false
if (-not [string]::IsNullOrWhiteSpace($testRoot)) {
  # Only inside the test seam may -SourceRoot be a plain folder.
  $worktree = $env:J3W1_KIT_TEST_SOURCE -eq 'worktree'
  if ([string]::IsNullOrWhiteSpace($SourceRoot)) { throw 'Test seam active (J3W1_KIT_TEST_ROOT): the network is disabled, pass -SourceRoot.' }
  $localAppData = Join-Path (Join-Path $testRoot 'AppData') 'Local'
} else {
  if (-not $IsWindows) { throw 'This installer configures the Orca desktop client on Windows; run it there with PowerShell 7 (pwsh).' }
  $localAppData = $env:LOCALAPPDATA
}
$final = (Join-Path $localAppData "j3w1-theme/orca/releases/$Revision").Replace('/', [System.IO.Path]::DirectorySeparatorChar)
# -WhatIf downloads into a temporary folder and deletes it afterwards.
$target = if ($planOnly) { Join-Path ([System.IO.Path]::GetTempPath()) "j3w1-orca-$Revision-$PID" } else { $final }

$readGit = {
  param([string[]]$Arguments)
  $info = [System.Diagnostics.ProcessStartInfo]::new('git')
  foreach ($argument in $Arguments) { $info.ArgumentList.Add($argument) }
  $info.RedirectStandardOutput = $true
  $info.RedirectStandardError = $true
  $info.UseShellExecute = $false
  try { $process = [System.Diagnostics.Process]::Start($info) } catch { throw 'git is required for -SourceRoot; it was not found on PATH.' }
  $buffer = [System.IO.MemoryStream]::new()
  $null = $process.StandardError.ReadToEndAsync()
  $process.StandardOutput.BaseStream.CopyTo($buffer)
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) { return $null }
  return , $buffer.ToArray()
}
if (-not [string]::IsNullOrWhiteSpace($SourceRoot) -and -not $worktree) {
  if ($null -eq (& $readGit @('-C', $SourceRoot, 'rev-parse', '--git-dir'))) { throw "-SourceRoot $SourceRoot is not a git checkout; the installer is read from git objects at -Revision." }
  if ($null -eq (& $readGit @('-C', $SourceRoot, 'cat-file', '-e', "$Revision^{commit}"))) { throw "-SourceRoot $SourceRoot does not contain commit $Revision. Fetch it and rerun." }
}

$client = $null
if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
  $client = [System.Net.Http.HttpClient]::new()
  $client.Timeout = [TimeSpan]::FromSeconds(60)
  $client.DefaultRequestHeaders.UserAgent.ParseAdd('j3w1-theme-installer')
}
$downloaded = @{}
try {
  foreach ($path in $files) {
    if ($null -eq $client -and -not $worktree) {
      $bytes = & $readGit @('-C', $SourceRoot, 'cat-file', 'blob', "${Revision}:$path")
      if ($null -eq $bytes) { throw "Commit $Revision has no $path in $SourceRoot; it predates this installer (v3.0.0 and later)." }
    } elseif ($null -eq $client) {
      $local = Join-Path $SourceRoot $path
      if (-not (Test-Path -LiteralPath $local -PathType Leaf)) { throw "Missing $path under -SourceRoot $SourceRoot." }
      $bytes = [System.IO.File]::ReadAllBytes($local)
    } else {
      $url = "https://raw.githubusercontent.com/$repository/$Revision/$path"
      $response = $client.GetAsync($url).GetAwaiter().GetResult()
      if ([int]$response.StatusCode -eq 404) { throw "Commit $Revision of $repository has no $path; it predates this installer (v3.0.0 and later)." }
      if (-not $response.IsSuccessStatusCode) { throw "GET $url failed: HTTP $([int]$response.StatusCode)" }
      $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    }
    $downloaded[$path] = $bytes
  }
} finally {
  if ($null -ne $client) { $client.Dispose() }
}

# The export must equal its entry in digests.json from the same commit
# before a single file is written.
$digestOf = {
  param([byte[]]$Bytes)
  if ([Array]::IndexOf($Bytes, [byte]13) -ge 0) { $Bytes = [System.Text.Encoding]::UTF8.GetBytes([System.Text.Encoding]::UTF8.GetString($Bytes).Replace("`r`n", "`n")) }
  'sha256-' + [Convert]::ToBase64String([System.Security.Cryptography.SHA256]::HashData($Bytes))
}
$digests = ConvertFrom-Json -InputObject ([System.Text.Encoding]::UTF8.GetString($downloaded[$digestsPath]).TrimStart([char]0xFEFF)) -AsHashtable
$expected = [string]$digests.files[$tokensPath]
$actual = & $digestOf $downloaded[$tokensPath]
if ([string]::IsNullOrWhiteSpace($expected) -or $actual -ne $expected) {
  throw "Digest mismatch for ${tokensPath} at ${Revision}: $digestsPath lists '$expected', the file is $actual. Nothing was written."
}
if (-not [string]::IsNullOrWhiteSpace($Tag)) {
  $version = [string](ConvertFrom-Json -InputObject ([System.Text.Encoding]::UTF8.GetString($downloaded[$tokensPath]).TrimStart([char]0xFEFF)) -AsHashtable).version
  if ($version -ne $Tag.Substring(1)) { throw "The export at $Tag ($Revision) is version $version, not $($Tag.Substring(1)). Refusing; nothing was written." }
}

foreach ($path in $files) {
  $destination = (Join-Path $target $path).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
  $folder = Split-Path -Parent $destination
  if (-not (Test-Path -LiteralPath $folder)) { [void](New-Item -ItemType Directory -Path $folder -Force -WhatIf:$false) }
  [System.IO.File]::WriteAllBytes($destination, $downloaded[$path])
}
# release.json comes last: a folder without it is an unfinished download.
$ref = if ([string]::IsNullOrWhiteSpace($Tag)) { $Revision } else { $Tag }
$record = [ordered]@{ schemaVersion = 1; id = 'j3w1-theme-installer'; repository = $repository; revision = $Revision; ref = $ref; files = $files }
[System.IO.File]::WriteAllText((Join-Path $target 'release.json'), (ConvertTo-Json -InputObject $record -Depth 4) + "`n", [System.Text.UTF8Encoding]::new($false))

$install = (Join-Path $final 'ports/orca/install').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
$command = { param([string]$Script, [string]$Arguments = '') "  pwsh -NoProfile -File `"$(Join-Path $install $Script)`"$Arguments" }
if ($planOnly) { Write-Host "Release $Revision downloaded and checked (in a temporary folder, for -WhatIf)." }
else { Write-Host "Release $Revision is in $final (export checked against digests.json)." }

if (-not $Apply -and -not $planOnly) {
  Write-Host ''
  Write-Host 'Next: quit Orca (tray icon too), then preview, apply and check:'
  Write-Host (& $command 'Apply-J3w1OrcaTheme.ps1' ' -WhatIf')
  Write-Host (& $command 'Apply-J3w1OrcaTheme.ps1')
  Write-Host (& $command 'Test-J3w1OrcaTheme.ps1')
  return
}

try {
  Import-Module (Join-Path $target 'ports/orca/install/J3w1Orca.psm1') -Force
  $context = New-J3w1Context -KitRoot $target
  $operation = if ($Update) { 'update' } else { 'apply' }
  $result = Invoke-J3w1OrcaApply -Context $context -Operation $operation -PlanOnly:$planOnly -SkipFontCheck:$SkipFontCheck -ShowDiff:$Update
  if ($planOnly) { return }
  Write-Host ''
  if ($result.StorePending) {
    Write-Host 'After the three Orca steps above, check the result in an Orca terminal:'
    Write-Host (& $command 'Test-J3w1OrcaTheme.ps1')
    return
  }
  $fails = Invoke-J3w1OrcaVerify -Context $context -NoSpecimen
  if ($fails -gt 0) { throw "The checks found $fails failure(s); see FAIL above." }
  Write-Host ''
  Write-Host 'Start Orca, then run the test in an Orca terminal to see the colours:'
  Write-Host (& $command 'Test-J3w1OrcaTheme.ps1')
  Write-Host 'To take the theme out again:'
  Write-Host (& $command 'Restore-J3w1OrcaTheme.ps1')
} finally {
  if ($planOnly) { Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue -WhatIf:$false }
}
