# J3w1Orca.psm1 - shared functions of the j3w1 theme installer for the Orca
# desktop client on Windows. The scripts next to this module are thin entry
# points; every rule lives here so Get, Apply, Update, Test and Restore share
# one code path.
#
# Values come only from the commit these scripts came from:
# exports/tokens.resolved.json (verified against exports/digests.json of the
# same commit), ports/orca/host.json and ports/orca/install/specimen.json.
# This file holds no colour values. orca-data.json is edited losslessly with
# System.Text.Json.Nodes: ConvertFrom-Json would coerce ISO dates, round large
# numbers and truncate deep objects, so it is never used on Orca's store.

Set-StrictMode -Version 3.0
$ErrorActionPreference = 'Stop'

$script:BlockStart = '# >>> j3w1-theme (managed; do not edit) >>>'
$script:BlockEnd = '# <<< j3w1-theme <<<'
$script:Utf8 = [System.Text.UTF8Encoding]::new($false)
$script:Esc = [char]27

# ---------------------------------------------------------------------------
# Environment, platform and test seam
# ---------------------------------------------------------------------------

function Join-J3w1Path {
  <# Join-Path with native separators: children are written with "/" and
     become "\" on Windows. #>
  param([string]$Base, [string]$Child)
  return (Join-Path $Base $Child).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
}

function Get-J3w1Environment {
  <# Resolves the folders the installer reads and writes. The test seam
     (J3W1_KIT_TEST_ROOT) maps APPDATA and LOCALAPPDATA under one fake root,
     reads Orca's running state and the installed fonts from variables, and
     disables the network. Inside the seam only, J3W1_KIT_TEST_SOURCE=worktree
     lets a plain folder be the source (the scripts' own folder, or
     -SourceRoot of Get-J3w1Orca.ps1); such a run never counts the pin as
     verified. The seam is never active otherwise. #>
  $testRoot = $env:J3W1_KIT_TEST_ROOT
  $seam = -not [string]::IsNullOrWhiteSpace($testRoot)
  if ($seam) {
    $appData = Join-J3w1Path $testRoot 'AppData/Roaming'
    $localAppData = Join-J3w1Path $testRoot 'AppData/Local'
    # The seam must never be aimed at the real profile folders.
    $full = { param($p) [System.IO.Path]::GetFullPath($p).TrimEnd('\', '/') }
    foreach ($real in @($env:APPDATA, $env:LOCALAPPDATA)) {
      if ([string]::IsNullOrWhiteSpace($real)) { continue }
      foreach ($fake in @($appData, $localAppData)) {
        if ([string]::Equals((& $full $fake), (& $full $real), [StringComparison]::OrdinalIgnoreCase)) {
          throw "Test seam refused: J3W1_KIT_TEST_ROOT ($testRoot) maps onto the real profile folder $real. Point it at a scratch folder."
        }
      }
    }
  } else {
    if (-not $IsWindows) {
      throw 'This kit configures the Orca desktop client on Windows; run it there with PowerShell 7 (pwsh).'
    }
    $appData = $env:APPDATA
    $localAppData = $env:LOCALAPPDATA
    if ([string]::IsNullOrWhiteSpace($appData) -or [string]::IsNullOrWhiteSpace($localAppData)) {
      throw 'APPDATA or LOCALAPPDATA is not set; run the kit from a normal Windows user session.'
    }
  }
  return @{
    TestSeam = $seam
    SourceWorktree = $seam -and $env:J3W1_KIT_TEST_SOURCE -eq 'worktree'
    AppData = $appData
    LocalAppData = $localAppData
    StateRoot = Join-J3w1Path $localAppData 'j3w1-theme/orca'
    Releases = Join-J3w1Path $localAppData 'j3w1-theme/orca/releases'
  }
}

# ---------------------------------------------------------------------------
# Bytes, digests and JSON
# ---------------------------------------------------------------------------

function Get-J3w1Digest {
  <# sha256 over the bytes with LF line endings, base64, "sha256-" prefix:
     the algorithm exports/digests.json declares. #>
  param([byte[]]$Bytes)
  if ([Array]::IndexOf($Bytes, [byte]13) -ge 0) {
    $text = [System.Text.Encoding]::UTF8.GetString($Bytes).Replace("`r`n", "`n")
    $Bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  }
  $hash = [System.Security.Cryptography.SHA256]::HashData($Bytes)
  return 'sha256-' + [Convert]::ToBase64String($hash)
}

function Get-J3w1FileDigest {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
  return Get-J3w1Digest -Bytes ([System.IO.File]::ReadAllBytes($Path))
}

function ConvertFrom-J3w1Bytes {
  param([byte[]]$Bytes)
  return [System.Text.Encoding]::UTF8.GetString($Bytes).TrimStart([char]0xFEFF)
}

function Read-J3w1Data {
  <# Reads a kit or export file as ordered hashtables. Only for files this
     repository publishes, never for Orca's store. #>
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Missing kit file: $Path" }
  return ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes ([System.IO.File]::ReadAllBytes($Path))) -AsHashtable
}

function Get-J3w1JsonOptions {
  if (-not (Get-Variable -Name JsonOptions -Scope Script -ErrorAction SilentlyContinue)) {
    $options = [System.Text.Json.JsonSerializerOptions]::new()
    $options.WriteIndented = $true
    $options.Encoder = [System.Text.Encodings.Web.JavaScriptEncoder]::UnsafeRelaxedJsonEscaping
    $script:JsonOptions = $options
  }
  return $script:JsonOptions
}

function Read-J3w1JsonNode {
  param([string]$Path)
  $text = ConvertFrom-J3w1Bytes ([System.IO.File]::ReadAllBytes($Path))
  try {
    $node = [System.Text.Json.Nodes.JsonNode]::Parse($text)
  } catch {
    throw "Cannot parse ${Path}: $($_.Exception.Message)"
  }
  return , $node
}

function ConvertTo-J3w1JsonText {
  <# Indented, relaxed escaping, LF only (raw CR/LF never occurs inside a JSON
     string, so the replacement only touches whitespace). #>
  param($Node)
  return $Node.ToJsonString((Get-J3w1JsonOptions)).Replace("`r`n", "`n") + "`n"
}

function ConvertTo-J3w1Compact {
  param($Node)
  if ($null -eq $Node) { return 'null' }
  return $Node.ToJsonString([System.Text.Json.JsonSerializerOptions]@{ Encoder = [System.Text.Encodings.Web.JavaScriptEncoder]::UnsafeRelaxedJsonEscaping })
}

function New-J3w1JsonNode {
  <# A JsonNode for a plain value the kit computed (string, number, ordered
     map) or a detached copy of an existing node. #>
  param($Value)
  if ($Value -is [System.Text.Json.Nodes.JsonNode]) { return , $Value.DeepClone() }
  return , [System.Text.Json.Nodes.JsonNode]::Parse((ConvertTo-Json -InputObject $Value -Depth 32 -Compress))
}

function Test-J3w1NodeEqual {
  param($A, $B)
  return [System.Text.Json.Nodes.JsonNode]::DeepEquals($A, $B)
}

function Get-J3w1KeyPath {
  <# Store keys: a bare name lives under "settings"; a dotted name is a path
     from the root (ui.uiZoomLevel). #>
  param([string]$Key)
  if ($Key.Contains('.')) { return , ($Key -split '\.') }
  return , @('settings', $Key)
}

function Get-J3w1NodeAt {
  param($Root, [string]$Key)
  $current = $Root
  foreach ($segment in (Get-J3w1KeyPath $Key)) {
    if ($current -isnot [System.Text.Json.Nodes.JsonObject] -or -not $current.ContainsKey($segment)) {
      return @{ Present = $false; Node = $null }
    }
    $current = $current[$segment]
  }
  return @{ Present = $true; Node = $current }
}

function Set-J3w1NodeAt {
  param($Root, [string]$Key, $Value)
  $segments = Get-J3w1KeyPath $Key
  $current = $Root
  for ($i = 0; $i -lt $segments.Count - 1; $i++) {
    $segment = $segments[$i]
    if (-not $current.ContainsKey($segment) -or $current[$segment] -isnot [System.Text.Json.Nodes.JsonObject]) {
      $current[$segment] = [System.Text.Json.Nodes.JsonObject]::new()
    }
    $current = $current[$segment]
  }
  $current[$segments[-1]] = (New-J3w1JsonNode $Value)
}

function Remove-J3w1NodeAt {
  param($Root, [string]$Key)
  $segments = Get-J3w1KeyPath $Key
  $current = $Root
  for ($i = 0; $i -lt $segments.Count - 1; $i++) {
    if ($current -isnot [System.Text.Json.Nodes.JsonObject] -or -not $current.ContainsKey($segments[$i])) { return }
    $current = $current[$segments[$i]]
  }
  if ($current -is [System.Text.Json.Nodes.JsonObject]) { [void]$current.Remove($segments[-1]) }
}

function Get-J3w1AbsentNode {
  return , [System.Text.Json.Nodes.JsonNode]::Parse('{"absent":true}')
}

function Test-J3w1AbsentNode {
  param($Node)
  return ($Node -is [System.Text.Json.Nodes.JsonObject]) -and $Node.Count -eq 1 -and $Node.ContainsKey('absent')
}

function Format-J3w1Value {
  param([hashtable]$Slot)
  if (-not $Slot.Present) { return '(absent)' }
  return ConvertTo-J3w1Compact $Slot.Node
}

function Write-J3w1Bytes {
  <# Writes through a temporary file in the same folder, then replaces, so a
     crash never leaves a half-written file. A symbolic link is written
     through: the final target gets the bytes and the link stays a link. #>
  param([string]$Path, [byte[]]$Bytes)
  if ($null -ne [System.IO.FileInfo]::new($Path).LinkTarget) {
    $Path = [System.IO.File]::ResolveLinkTarget($Path, $true).FullName
  }
  $folder = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $folder)) { [void](New-Item -ItemType Directory -Path $folder -Force) }
  $temporary = "$Path.j3w1-tmp"
  [System.IO.File]::WriteAllBytes($temporary, $Bytes)
  [System.IO.File]::Move($temporary, $Path, $true)
}

function Write-J3w1Text {
  param([string]$Path, [string]$Text)
  Write-J3w1Bytes -Path $Path -Bytes $script:Utf8.GetBytes($Text)
}

function Get-J3w1Timestamp {
  param([datetime]$Now = [datetime]::UtcNow)
  return $Now.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", [cultureinfo]::InvariantCulture)
}

function Format-J3w1Number {
  param($Value)
  return [string]::Format([cultureinfo]::InvariantCulture, '{0}', $Value)
}

# ---------------------------------------------------------------------------
# Source: the release folder or clone the scripts run from
# ---------------------------------------------------------------------------

$script:InstallerId = 'j3w1-theme-installer'
$script:Repository = 'j3w1/theme'
$script:ThemeName = 'j3w1-theme'
$script:ThemeProfile = 'default'
# The first release whose tree carries this installer (ports/orca/install).
$script:FirstInstallerTag = 'v3.0.0'
$script:TokensPath = 'exports/tokens.resolved.json'
$script:DigestsPath = 'exports/digests.json'
$script:HostPath = 'ports/orca/host.json'
$script:SpecimenPath = 'ports/orca/install/specimen.json'
$script:TagPattern = '^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$'
# Consume roles within their documented scope, never primitives
# (agents/consume.md); use-and-report roles are disclosed.
$script:Eligibility = @{ allowedActions = @('use', 'use-and-report'); forbiddenPrefixes = @('color.primitive.') }

function Test-J3w1TagAtLeast {
  <# $Tag is $Floor or a later release (major, minor, patch). #>
  param([string]$Tag, [string]$Floor)
  $a = @($Tag.TrimStart('v').Split('-')[0].Split('.') | ForEach-Object { [int]$_ })
  $b = @($Floor.TrimStart('v').Split('.') | ForEach-Object { [int]$_ })
  for ($i = 0; $i -lt 3; $i++) { if ($a[$i] -ne $b[$i]) { return $a[$i] -gt $b[$i] } }
  return $true
}

function Format-J3w1Pin {
  param($Pin)
  if ($Pin.Ref -eq $Pin.Revision) { return "commit $($Pin.Revision)" }
  return "$($Pin.Ref) @ $($Pin.Revision)"
}

function Invoke-J3w1Http {
  <# GET over HTTPS. Returns the body bytes, or $null on 404 with
     -AllowNotFound. A GITHUB_TOKEN, if set, is sent to api.github.com only
     and never printed. #>
  param($Environment, [string]$Url, [switch]$AllowNotFound)
  if ($Environment.TestSeam) { throw "Test seam active (J3W1_KIT_TEST_ROOT): the network is disabled, pass -SourceRoot. Refused: $Url" }
  if ($Url -notmatch '^https://(api\.github\.com|raw\.githubusercontent\.com)/') { throw "Refusing an unexpected URL: $Url" }
  $client = [System.Net.Http.HttpClient]::new()
  try {
    $client.Timeout = [TimeSpan]::FromSeconds(60)
    $client.DefaultRequestHeaders.UserAgent.ParseAdd($script:InstallerId)
    if ($Url.StartsWith('https://api.github.com/')) {
      $client.DefaultRequestHeaders.Accept.ParseAdd('application/vnd.github+json')
      if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) {
        $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $env:GITHUB_TOKEN)
      }
    }
    $response = $client.GetAsync($Url).GetAwaiter().GetResult()
    if ($AllowNotFound -and [int]$response.StatusCode -eq 404) { return $null }
    if (-not $response.IsSuccessStatusCode) { throw "GET $Url failed: HTTP $([int]$response.StatusCode) $($response.ReasonPhrase)" }
    return , $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
  } finally {
    $client.Dispose()
  }
}

function Invoke-J3w1Git {
  <# Runs git and returns stdout as bytes (a pipeline would re-encode them). #>
  param([string[]]$Arguments, [switch]$AllowFailure)
  $info = [System.Diagnostics.ProcessStartInfo]::new('git')
  foreach ($argument in $Arguments) { $info.ArgumentList.Add($argument) }
  $info.RedirectStandardOutput = $true
  $info.RedirectStandardError = $true
  $info.UseShellExecute = $false
  try { $process = [System.Diagnostics.Process]::Start($info) } catch { throw 'git is required to read a clone; it was not found on PATH.' }
  $buffer = [System.IO.MemoryStream]::new()
  $errors = $process.StandardError.ReadToEndAsync()
  $process.StandardOutput.BaseStream.CopyTo($buffer)
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) {
    if ($AllowFailure) { return $null }
    throw "git $($Arguments -join ' ') failed: $($errors.Result.Trim())"
  }
  return , $buffer.ToArray()
}

function Get-J3w1GitText {
  param([string[]]$Arguments)
  $bytes = Invoke-J3w1Git -Arguments $Arguments -AllowFailure
  if ($null -eq $bytes) { return $null }
  return (ConvertFrom-J3w1Bytes $bytes).Trim()
}

function Get-J3w1TagFor {
  <# The newest release tag in a clone that names $Revision, else $null. #>
  param([string]$Root, [string]$Revision)
  $tags = @((Get-J3w1GitText @('-C', $Root, 'tag', '--points-at', $Revision)) -split "`n" | Where-Object { $_ -match $script:TagPattern })
  $best = $null
  foreach ($tag in $tags) { if ($null -eq $best -or -not (Test-J3w1TagAtLeast $best $tag)) { $best = $tag } }
  return $best
}

function Resolve-J3w1TagRevision {
  <# Resolves a release tag to its commit: through the GitHub API, or through
     git in a local clone. A lightweight tag's object.sha is the commit; an
     annotated tag is followed to the commit it names. #>
  param($Environment, [string]$Ref, [string]$SourceRoot)
  if ($Ref -notmatch $script:TagPattern) { throw "Not a release tag: '$Ref'. Pass an exact tag such as $($script:FirstInstallerTag); branches and 'latest' are refused." }
  if (-not [string]::IsNullOrWhiteSpace($SourceRoot)) {
    $sha = Get-J3w1GitText @('-C', $SourceRoot, 'rev-parse', '--verify', '--quiet', "refs/tags/$Ref^{commit}")
    if ([string]::IsNullOrWhiteSpace($sha)) { throw "Tag $Ref does not exist in $SourceRoot." }
    return $sha
  }
  $url = "https://api.github.com/repos/$($script:Repository)/git/ref/tags/$Ref"
  $body = Invoke-J3w1Http -Environment $Environment -Url $url -AllowNotFound
  if ($null -eq $body) { throw "Tag $Ref does not exist in $($script:Repository)." }
  $data = ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $body) -AsHashtable
  if ($data -isnot [System.Collections.IDictionary]) { throw "Tag $Ref is ambiguous in $($script:Repository)." }
  if ($data.object.type -eq 'tag') {
    # An annotated tag: its tag object names the commit.
    $body = Invoke-J3w1Http -Environment $Environment -Url ([string]$data.object.url)
    $data = ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $body) -AsHashtable
  }
  if ($data.object.type -ne 'commit') { throw "Tag $Ref points to a $($data.object.type), not a commit. Refusing." }
  return [string]$data.object.sha
}

function Get-J3w1Source {
  <# Where a run takes its values from, decided by the folder the scripts sit
     in (the repository root, three levels above install/). Every value
     comes from one commit, the commit these scripts came from:
       download  a release folder Get-J3w1Orca.ps1 wrote; release.json names
                 its commit, and the export is verified on every run.
       git       a clone of the repository: git objects at its HEAD, never
                 the working tree.
       worktree  inside the test seam only (J3W1_KIT_TEST_SOURCE=worktree): a
                 plain folder, read as it is and never counted as verified. #>
  param($Environment, [string]$KitRoot)
  $root = [System.IO.Path]::GetFullPath($KitRoot).TrimEnd('\', '/')
  $record = Join-J3w1Path $root 'release.json'
  if (Test-Path -LiteralPath $record -PathType Leaf) {
    $data = Read-J3w1Data $record
    $revision = [string]$data.revision
    if ($data.schemaVersion -ne 1 -or $revision -cnotmatch '^[0-9a-f]{40}$') { throw "$record is not a release record of this installer. Download the release again with Get-J3w1Orca.ps1." }
    $ref = if ([string]$data.ref -match $script:TagPattern) { [string]$data.ref } else { $revision }
    return @{ Kind = 'download'; Root = $root; Revision = $revision; Ref = $ref; Verified = $true; Label = "release folder $root" }
  }
  if ($Environment.SourceWorktree) {
    return @{ Kind = 'worktree'; Root = $root; Revision = ('0' * 40); Ref = 'worktree'; Verified = $false; Label = "working tree $root (test seam)" }
  }
  if ((Get-J3w1GitText @('-C', $root, 'rev-parse', '--is-inside-work-tree')) -eq 'true' -and [string]::IsNullOrEmpty((Get-J3w1GitText @('-C', $root, 'rev-parse', '--show-prefix')))) {
    $revision = Get-J3w1GitText @('-C', $root, 'rev-parse', '--verify', '--quiet', 'HEAD^{commit}')
    if ($revision -cmatch '^[0-9a-f]{40}$') {
      $tag = Get-J3w1TagFor $root $revision
      $ref = if ($null -ne $tag) { $tag } else { $revision }
      return @{ Kind = 'git'; Root = $root; Revision = $revision; Ref = $ref; Verified = $true; Label = "clone $root (git objects at $revision)" }
    }
  }
  throw "$root is neither a release folder (it has no release.json) nor a clone of $($script:Repository). Download a release with Get-J3w1Orca.ps1 and run the scripts from the folder it prints."
}

function Read-J3w1SourceBytes {
  <# One repository file from a source: its folder (download, worktree) or
     git objects at its commit (git). $null when it is absent. #>
  param($Source, [string]$Path)
  if ($Source.Kind -eq 'git') {
    return , (Invoke-J3w1Git -Arguments @('-C', $Source.Root, 'cat-file', 'blob', "$($Source.Revision):$Path") -AllowFailure)
  }
  $file = Join-J3w1Path $Source.Root $Path
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { return $null }
  return , [System.IO.File]::ReadAllBytes($file)
}

function Read-J3w1HostFiles {
  <# ports/orca/host.json (which Orca keys the installer sets, from which
     roles) and the generated specimen, from a source. #>
  param($Source)
  $load = {
    param([string]$Path)
    $bytes = Read-J3w1SourceBytes $Source $Path
    if ($null -eq $bytes) {
      $hint = if ($Source.Kind -eq 'git') { "Commit $($Source.Revision) predates this installer ($($script:FirstInstallerTag) and later)." } else { 'Download the release again with Get-J3w1Orca.ps1.' }
      throw "Missing $Path in the $($Source.Label). $hint"
    }
    ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $bytes) -AsHashtable
  }
  $roles = & $load $script:HostPath
  if ($roles.schemaVersion -ne 1) { throw "Unsupported $($script:HostPath) schemaVersion $($roles.schemaVersion) in the $($Source.Label)." }
  return @{ Label = $Source.Label; Roles = $roles; Specimen = (& $load $script:SpecimenPath) }
}

function Get-J3w1Export {
  <# Reads and verifies the export of a source: tokens.resolved.json must
     equal its entry in digests.json from the same commit, and, when Test
     passes one, the digest the last apply recorded. A release folder is
     verified again on every run; a copy that fails is removed, so the next
     download replaces it. #>
  param($Source, $PinnedDigest)
  $tokensBytes = Read-J3w1SourceBytes $Source $script:TokensPath
  $digestsBytes = Read-J3w1SourceBytes $Source $script:DigestsPath
  $refuse = {
    param([string]$Message)
    if ($Source.Kind -eq 'download') {
      foreach ($path in $script:TokensPath, $script:DigestsPath) { Remove-Item -LiteralPath (Join-J3w1Path $Source.Root $path) -Force -ErrorAction SilentlyContinue }
      $Message += " The downloaded copy was removed; download the release again (Get-J3w1Orca.ps1 -Revision $($Source.Revision))."
    }
    throw $Message
  }
  if ($null -eq $tokensBytes -or $null -eq $digestsBytes) { & $refuse "$($script:TokensPath) or $($script:DigestsPath) is missing in the $($Source.Label)." }
  $actual = Get-J3w1Digest $tokensBytes
  $digests = ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $digestsBytes) -AsHashtable
  $expected = $digests.files[$script:TokensPath]
  if ([string]::IsNullOrWhiteSpace($expected)) { & $refuse "$($script:DigestsPath) lists no digest for $($script:TokensPath). Refusing." }
  if ($actual -ne $expected) { & $refuse "Digest mismatch for $($script:TokensPath): expected $expected from $($script:DigestsPath), got $actual. Refusing to use it." }
  $check = "$($script:DigestsPath) at the same commit"
  if ($null -ne $PinnedDigest) {
    if ($actual -ne $PinnedDigest.Digest) { & $refuse "Digest mismatch for $($script:TokensPath): $($PinnedDigest.Source) records $($PinnedDigest.Digest), got $actual. Refusing to use it." }
    $check += " and $($PinnedDigest.Source)"
  }
  if (-not $Source.Verified) { $check = 'working tree (test seam): the pin is NOT verified' }
  $tokens = ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $tokensBytes) -AsHashtable
  if ($Source.Ref -match $script:TagPattern -and [string]$tokens.version -ne $Source.Ref.Substring(1)) { throw "The export at $($Source.Ref) is version $($tokens.version), not $($Source.Ref.Substring(1)). Refusing." }
  $profile = $tokens.profiles[$script:ThemeProfile]
  if ($null -eq $profile) { throw "Profile '$($script:ThemeProfile)' is not in the export." }
  if ($profile.status -ne 'approved') { throw "Profile '$($script:ThemeProfile)' is $($profile.status); only an approved profile is delivered." }
  return @{
    Version = [string]$tokens.version
    Tokens = $profile.tokens
    Eligibility = $script:Eligibility
    Digests = [ordered]@{ $script:TokensPath = $actual; $script:DigestsPath = (Get-J3w1Digest $digestsBytes) }
    PinCheck = $check
    PinVerified = [bool]$Source.Verified
    SourceKind = $Source.Kind
  }
}

# ---------------------------------------------------------------------------
# Token resolution and expected values
# ---------------------------------------------------------------------------

function Add-J3w1Disclosure {
  param([System.Collections.Generic.List[object]]$Disclosures, [string]$Token, $DecisionIds)
  foreach ($id in @($DecisionIds)) {
    $exists = $false
    foreach ($item in $Disclosures) { if ($item.decisionId -eq $id -and $item.token -eq $Token) { $exists = $true } }
    if (-not $exists) { $Disclosures.Add([ordered]@{ decisionId = [string]$id; token = $Token }) }
  }
}

function Resolve-J3w1Token {
  <# A token id to the value a host takes: colours as lowercase #rrggbb from
     .css, a font family as its first name (pick=first), a dimension as its
     number. Primitives and ineligible roles are refused. #>
  param($Export, [string]$Id, [string]$Pick, [System.Collections.Generic.List[object]]$Disclosures)
  foreach ($prefix in $Export.Eligibility.forbiddenPrefixes) {
    if ($Id.StartsWith($prefix)) { throw "Refusing $Id - primitives ($prefix*) are never consumed." }
  }
  $token = $Export.Tokens[$Id]
  if ($null -eq $token) { throw "Token $Id is not in the pinned export." }
  $action = $token.eligibility.action
  if ($Export.Eligibility.allowedActions -notcontains $action) { throw "Refusing $Id - its eligibility is '$action'." }
  if ($action -eq 'use-and-report' -and $null -ne $Disclosures) { Add-J3w1Disclosure $Disclosures $Id $token.eligibility.decisionIds }
  switch ($token.type) {
    'color' {
      $value = ([string]$token.css).ToLowerInvariant()
      if ($value -notmatch '^#[0-9a-f]{6}$') { throw "Token $Id is not an opaque sRGB colour ($value)." }
      return $value
    }
    'fontFamily' {
      if ($Pick -ne 'first') { throw "Token $Id needs pick=first; hosts take one family name." }
      return [string]@($token.value)[0]
    }
    'dimension' { return $token.value.value }
    default { throw "Token $Id has an unsupported type '$($token.type)'." }
  }
}

function Get-J3w1Expected {
  <# Every value the kit sets, in the order ports/orca/host.json lists them.
     A preference (terminalFontSize) is carried from the machine, never set:
     it is not in Settings, and the Ghostty block carries font-size only
     when the machine has a size, so Import from Ghostty never changes it. #>
  param($KitFiles, $Export, $CurrentFontSize)
  $roles = $KitFiles.Roles
  $disclosures = [System.Collections.Generic.List[object]]::new()
  $fontSize = $CurrentFontSize
  $settings = [ordered]@{}
  $overrides = [ordered]@{}
  foreach ($name in $roles.orca.terminalColorOverrides.Keys) {
    $overrides[$name] = Resolve-J3w1Token $Export $roles.orca.terminalColorOverrides[$name] '' $disclosures
  }
  $settings['terminalColorOverrides'] = $overrides
  foreach ($name in $roles.orca.settings.Keys) {
    $rule = $roles.orca.settings[$name]
    if ($rule.Contains('value')) {
      $settings[$name] = $rule.value
    } else {
      $pick = if ($rule.Contains('pick')) { $rule.pick } else { '' }
      $value = Resolve-J3w1Token $Export $rule.token $pick $disclosures
      if ($rule.Contains('preference')) { continue }
      $settings[$name] = $value
    }
  }
  $lines = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $roles.ghostty.lines) {
    $pick = if ($line.Contains('pick')) { $line.pick } else { '' }
    $value = Resolve-J3w1Token $Export $line.token $pick $disclosures
    if ($line.Contains('preference')) {
      if ($null -eq $fontSize) { continue }
      $value = $fontSize
    }
    $text = if ($value -is [string]) { $value } else { Format-J3w1Number $value }
    if ($line.Contains('index')) { $text = "$($line.index)=$text" }
    $lines.Add("$($line.key) = $text")
  }
  return @{
    Settings = $settings
    GhosttyLines = $lines
    FontSize = $fontSize
    Disclosures = $disclosures
  }
}

function Get-J3w1GhosttyBlock {
  param($Pin, $Expected, [string]$NewLine = "`n")
  $lines = @($script:BlockStart,
    "# $($Pin.Name) $($Pin.Version) ($(Format-J3w1Pin $Pin)), $($Pin.Profile) profile, for Orca's Import from Ghostty.") + $Expected.GhosttyLines + @($script:BlockEnd)
  return ($lines -join $NewLine) + $NewLine
}

# ---------------------------------------------------------------------------
# Ghostty files
# ---------------------------------------------------------------------------

function Get-J3w1BlockPattern {
  return '(?m)^' + [regex]::Escape($script:BlockStart) + '[^\n]*\n[\s\S]*?^' + [regex]::Escape($script:BlockEnd) + '[^\n]*(\n|$)'
}

function ConvertTo-J3w1GhosttyState {
  <# config.ghostty bytes (or $null for a missing file) as text, with the
     managed block located. A UTF-8 BOM is kept as it was. #>
  param([string]$Path, [byte[]]$Bytes)
  $state = @{ Path = $Path; Exists = $false; Bom = $false; Text = ''; NewLine = "`n"; Match = $null; Blocks = 0; Bytes = $null }
  if ($null -ne $Bytes) {
    $state.Exists = $true
    $state.Bytes = $Bytes
    $state.Bom = $Bytes.Length -ge 3 -and $Bytes[0] -eq 0xEF -and $Bytes[1] -eq 0xBB -and $Bytes[2] -eq 0xBF
    $state.Text = ConvertFrom-J3w1Bytes $Bytes
    if ($state.Text.Contains("`r`n")) { $state.NewLine = "`r`n" }
    $found = [regex]::Matches($state.Text, (Get-J3w1BlockPattern))
    $state.Blocks = $found.Count
    if ($found.Count -gt 0) { $state.Match = $found[0] }
  }
  return $state
}

function Read-J3w1Ghostty {
  <# config.ghostty as text, with the managed block located. An existing
     empty file is a file (its empty byte[] is not unrolled to $null). A
     symbolic link whose target is missing stops the run. #>
  param([string]$Path)
  $link = [System.IO.FileInfo]::new($Path).LinkTarget
  if ($null -ne $link) {
    $final = $null
    try { $final = [System.IO.File]::ResolveLinkTarget($Path, $true) } catch { }
    if ($null -eq $final -or -not $final.Exists) {
      throw "$Path is a symbolic link to $link, which does not exist. Restore the link's target (or remove the link) and rerun; nothing was written."
    }
  }
  $bytes = $null
  if (Test-Path -LiteralPath $Path -PathType Leaf) { $bytes = [System.IO.File]::ReadAllBytes($Path) }
  return ConvertTo-J3w1GhosttyState -Path $Path -Bytes $bytes
}

function Assert-J3w1SingleBlock {
  <# Apply and Restore edit exactly one managed block; several copies are
     refused before anything is written. #>
  param($State)
  if ($State.Blocks -gt 1) {
    throw "$($State.Path) holds $($State.Blocks) j3w1-theme managed blocks. Delete the extra copies by hand (keep at most one) and rerun; nothing was written."
  }
}

function Get-J3w1GhosttyText {
  <# The text with the managed block set to $Block (replaced in place, or
     appended after a blank line), or removed when $Block is $null. Every
     character outside the block is kept. #>
  param($State, $Block)
  $text = $State.Text
  if ($null -ne $Block) { $Block = $Block.Replace("`r`n", "`n").Replace("`n", $State.NewLine) }
  if ($null -ne $State.Match) {
    $replacement = if ($null -eq $Block) { '' } else { $Block }
    return $text.Substring(0, $State.Match.Index) + $replacement + $text.Substring($State.Match.Index + $State.Match.Length)
  }
  if ($null -eq $Block) { return $text }
  if ($text.Length -eq 0) { return $Block }
  if (-not $text.EndsWith("`n")) { $text += $State.NewLine }
  return $text + $State.NewLine + $Block
}

function ConvertTo-J3w1GhosttyBytes {
  param($State, [string]$Text)
  $bytes = $script:Utf8.GetBytes($Text)
  if ($State.Bom) { $bytes = [byte[]](@(0xEF, 0xBB, 0xBF) + $bytes) }
  return , $bytes
}

function Get-J3w1GhosttyUpdate {
  <# The new config.ghostty bytes: the block replaced in place, or appended. #>
  param($State, $Pin, $Expected)
  $block = Get-J3w1GhosttyBlock -Pin $Pin -Expected $Expected
  return , (ConvertTo-J3w1GhosttyBytes $State (Get-J3w1GhosttyText $State $block))
}

function Get-J3w1GhosttyEntries {
  param([string]$Text)
  $entries = [System.Collections.Generic.List[object]]::new()
  $number = 0
  foreach ($line in ($Text -split "`r?`n")) {
    $number++
    if ($line -match '^\s*([A-Za-z0-9-]+)\s*=\s*(.*?)\s*$') { $entries.Add(@{ Key = $Matches[1]; Value = $Matches[2]; Line = $number }) }
  }
  return $entries
}

function Get-J3w1GhosttyLines {
  <# The setting lines of a Ghostty text, normalised to "key = value". #>
  param([string]$Text)
  $lines = [System.Collections.Generic.List[string]]::new()
  foreach ($entry in (Get-J3w1GhosttyEntries $Text)) { $lines.Add("$($entry.Key) = $($entry.Value)") }
  return , $lines
}

function Compare-J3w1Lines {
  <# Position by position: "- found" and "+ expected" for every mismatch. #>
  param($Found, $Expected)
  $out = [System.Collections.Generic.List[string]]::new()
  $count = [math]::Max($Found.Count, $Expected.Count)
  for ($i = 0; $i -lt $count; $i++) {
    $a = if ($i -lt $Found.Count) { $Found[$i] } else { $null }
    $b = if ($i -lt $Expected.Count) { $Expected[$i] } else { $null }
    if ($a -ceq $b) { continue }
    if ($null -ne $a) { $out.Add("- $a") }
    if ($null -ne $b) { $out.Add("+ $b") }
  }
  return $out
}

function Get-J3w1GhosttyConflicts {
  <# Theme keys that would win over the managed block on import: any in the
     later file (config), and any after the block in config.ghostty. The
     theme keys are the managed colour and font-family keys plus "theme";
     font-size is a user preference and is not reported. #>
  param($KitFiles, $Environment)
  $themeKeys = @('theme') + @($KitFiles.Roles.ghostty.lines | Where-Object { -not $_.Contains('preference') } | ForEach-Object { $_.key }) | Select-Object -Unique
  $conflicts = [System.Collections.Generic.List[string]]::new()
  $ghosttyDir = Join-J3w1Path $Environment.AppData 'ghostty'
  $primary = Read-J3w1Ghostty (Join-J3w1Path $ghosttyDir 'config.ghostty')
  if ($null -ne $primary.Match) {
    $after = $primary.Text.Substring($primary.Match.Index + $primary.Match.Length)
    foreach ($entry in (Get-J3w1GhosttyEntries $after)) {
      if ($themeKeys -contains $entry.Key) { $conflicts.Add("config.ghostty sets '$($entry.Key)' after the managed block") }
    }
  }
  $later = Join-J3w1Path $ghosttyDir 'config'
  if (Test-Path -LiteralPath $later -PathType Leaf) {
    foreach ($entry in (Get-J3w1GhosttyEntries (ConvertFrom-J3w1Bytes ([System.IO.File]::ReadAllBytes($later))))) {
      if ($themeKeys -contains $entry.Key) { $conflicts.Add("config line $($entry.Line) sets '$($entry.Key)'; that file is read after config.ghostty and wins on import") }
    }
  }
  return , $conflicts
}

# ---------------------------------------------------------------------------
# Orca and the machine
# ---------------------------------------------------------------------------

function Get-J3w1OrcaPaths {
  param($Environment)
  $orcaDir = Join-J3w1Path $Environment.AppData 'orca'
  $index = Join-J3w1Path $orcaDir 'orca-profile-index.json'
  if (-not (Test-Path -LiteralPath $index -PathType Leaf)) {
    throw "Orca's profile index is missing ($index). Install Orca, start it once so it creates its profile, quit it, and rerun."
  }
  $profileId = (Read-J3w1Data $index).activeProfileId
  if ([string]::IsNullOrWhiteSpace($profileId)) { throw "$index has no activeProfileId." }
  if ($profileId -notmatch '^[A-Za-z0-9._-]+$' -or $profileId -match '^\.+$') { throw "Unexpected activeProfileId '$profileId' in $index." }
  $settings = Join-J3w1Path $orcaDir "profiles/$profileId/orca-data.json"
  if (-not (Test-Path -LiteralPath $settings -PathType Leaf)) {
    throw "Orca's settings file is missing ($settings). Start Orca once with this profile, quit it, and rerun."
  }
  $ghosttyDir = Join-J3w1Path $Environment.AppData 'ghostty'
  return @{
    ProfileId = $profileId
    Settings = $settings
    Ghostty = Join-J3w1Path $ghosttyDir 'config.ghostty'
    GhosttyLater = Join-J3w1Path $ghosttyDir 'config'
  }
}

function Test-J3w1OrcaRunning {
  <# Orca keeps its settings in memory and rewrites the whole store on any
     change, so the store is only written while no Orca process (the window
     or the tray) exists. #>
  param($Environment)
  if ($Environment.TestSeam) { return $env:J3W1_KIT_TEST_ORCA_RUNNING -eq '1' }
  return $null -ne (Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq 'Orca' } | Select-Object -First 1)
}

function Get-J3w1OrcaVersion {
  <# The installed version from Orca.exe's file version, or an unpacked
     resources/app/package.json. "unknown" rather than a guess. #>
  param($Environment)
  $folders = @((Join-J3w1Path $Environment.LocalAppData 'Programs/orca'), (Join-J3w1Path $Environment.LocalAppData 'Programs/Orca'))
  if (-not $Environment.TestSeam -and $env:ProgramFiles) { $folders += (Join-J3w1Path $env:ProgramFiles 'Orca') }
  foreach ($folder in $folders) {
    $package = Join-J3w1Path $folder 'resources/app/package.json'
    if (Test-Path -LiteralPath $package -PathType Leaf) {
      try {
        $version = [string](Read-J3w1Data $package).version
        if ($version -match '^\d+\.\d+\.\d+') { return $Matches[0] }
      } catch { }
    }
    $exe = Join-J3w1Path $folder 'Orca.exe'
    if ($IsWindows -and (Test-Path -LiteralPath $exe -PathType Leaf)) {
      $version = [string](Get-Item -LiteralPath $exe).VersionInfo.ProductVersion
      if ($version -match '^\d+\.\d+\.\d+') { return $Matches[0] }
    }
  }
  return 'unknown'
}

function Get-J3w1ClaudeVersion {
  $command = Get-Command -Name claude -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $command) { return $null }
  try {
    $info = [System.Diagnostics.ProcessStartInfo]::new($command.Source)
    $info.ArgumentList.Add('--version')
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.UseShellExecute = $false
    $process = [System.Diagnostics.Process]::Start($info)
    $output = $process.StandardOutput.ReadToEndAsync()
    if (-not $process.WaitForExit(15000)) { $process.Kill(); return $null }
    if ($output.Result -match '\d+\.\d+\.\d+') { return $Matches[0] }
  } catch { }
  return $null
}

function Test-J3w1FontInstalled {
  <# Looks for the family in the per-user and machine font registrations. A
     Nerd Fonts "NFM" family is also registered under its long name
     ("... Nerd Font Mono") and its files are named "...NerdFontMono-*". #>
  param($Environment, [string]$Family)
  $names = [System.Collections.Generic.List[string]]::new()
  $files = [System.Collections.Generic.List[string]]::new()
  if ($Environment.TestSeam) {
    foreach ($name in ([string]$env:J3W1_KIT_TEST_FONTS -split ';')) { if ($name.Trim()) { $names.Add($name.Trim()) } }
  } else {
    foreach ($key in @('HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts', 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts')) {
      $item = Get-Item -LiteralPath $key -ErrorAction SilentlyContinue
      if ($null -eq $item) { continue }
      foreach ($name in $item.GetValueNames()) {
        $names.Add($name)
        $files.Add([string]$item.GetValue($name))
      }
    }
  }
  $prefixes = @($Family)
  $filePrefix = $null
  if ($Family -match '^(.+) NFM$') {
    $prefixes += "$($Matches[1]) Nerd Font Mono"
    $filePrefix = ($Matches[1] -replace '\s', '') + 'NerdFontMono'
  }
  foreach ($name in $names) {
    foreach ($prefix in $prefixes) {
      if ($name -eq $prefix -or $name.StartsWith("$prefix ", [StringComparison]::OrdinalIgnoreCase) -or $name.StartsWith("$prefix(", [StringComparison]::OrdinalIgnoreCase)) { return $true }
    }
  }
  if ($filePrefix) {
    foreach ($file in $files) { if ((Split-Path -Leaf $file).StartsWith($filePrefix, [StringComparison]::OrdinalIgnoreCase)) { return $true } }
  }
  return $false
}

function Get-J3w1FontFix {
  param([string]$Family)
  $long = if ($Family -match '^(.+) NFM$') { "$($Matches[1]) Nerd Font Mono" } else { $Family }
  return @(
    "The terminal font '$Family' is not installed.",
    'Fix: download SourceCodePro.zip from the Nerd Fonts releases (https://github.com/ryanoasis/nerd-fonts/releases/latest),',
    "install the '$long' files (SauceCodeProNerdFontMono-*.ttf; right-click > Install for all users),",
    "then rerun. Windows lists that family as '$Family'. To continue without it, rerun with -SkipFontCheck."
  ) -join [Environment]::NewLine
}

# ---------------------------------------------------------------------------
# Context
# ---------------------------------------------------------------------------

function New-J3w1Context {
  <# Everything a run needs: folders, the source, the host map and specimen,
     the verified export, and the pin they make (the commit, the release tag
     that names it when known, and the export's version). #>
  param([string]$KitRoot, $Source, $PinnedDigest)
  $environment = Get-J3w1Environment
  if ($null -eq $Source) { $Source = Get-J3w1Source -Environment $environment -KitRoot $KitRoot }
  $kitFiles = Read-J3w1HostFiles $Source
  $export = Get-J3w1Export -Source $Source -PinnedDigest $PinnedDigest
  $pin = @{ Name = $script:ThemeName; Repository = $script:Repository; Version = $export.Version; Ref = $Source.Ref; Revision = $Source.Revision; Profile = $script:ThemeProfile }
  return @{ Environment = $environment; Source = $Source; KitFiles = $kitFiles; Pin = $pin; Export = $export }
}

function Get-J3w1CurrentManifest {
  param($Environment)
  $path = Join-J3w1Path $Environment.StateRoot 'current/manifest.json'
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $null }
  return , (Read-J3w1JsonNode $path)
}

function Get-J3w1ManagedKeys {
  <# The keys the kit sets; a preference (the font size) is never set. #>
  param($KitFiles)
  $settings = $KitFiles.Roles.orca.settings
  return , (@('terminalColorOverrides') + @($settings.Keys | Where-Object { -not $settings[$_].Contains('preference') }))
}

function Get-J3w1PreferenceKeys {
  <# Keys carried from the machine and never set (the font size): recorded
     with the preserved keys. #>
  param($KitFiles)
  $settings = $KitFiles.Roles.orca.settings
  return @($settings.Keys | Where-Object { $settings[$_].Contains('preference') })
}

# ---------------------------------------------------------------------------
# Manifest, lock and backups
# ---------------------------------------------------------------------------

function New-J3w1BackupFolder {
  param($Environment)
  $root = Join-J3w1Path $Environment.StateRoot 'backups'
  $name = [datetime]::UtcNow.ToString("yyyyMMdd'T'HHmmss'Z'", [cultureinfo]::InvariantCulture)
  $candidate = $name
  $n = 0
  while (Test-Path -LiteralPath (Join-J3w1Path $root $candidate)) { $n++; $candidate = "$name-$n" }
  $path = Join-J3w1Path $root $candidate
  [void](New-Item -ItemType Directory -Path $path -Force)
  return @{ Name = $candidate; Path = $path }
}

function Get-J3w1PreKitStorePath {
  param($Environment)
  return Join-J3w1Path $Environment.StateRoot 'pre-kit/orca-data.json'
}

function Test-J3w1SameValue {
  <# Equal JSON values, with strings compared case-insensitively (Orca may
     write a colour in another case) and numbers by value. #>
  param($A, $B)
  if ($null -eq $A -or $null -eq $B) { return $null -eq $A -and $null -eq $B }
  if ($A -is [System.Text.Json.Nodes.JsonObject] -and $B -is [System.Text.Json.Nodes.JsonObject]) {
    if ($A.Count -ne $B.Count) { return $false }
    foreach ($pair in $A) {
      if (-not $B.ContainsKey($pair.Key)) { return $false }
      if (-not (Test-J3w1SameValue $pair.Value $B[$pair.Key])) { return $false }
    }
    return $true
  }
  $kindA = $A.GetValueKind()
  if ($kindA -ne $B.GetValueKind()) { return $false }
  if ($kindA -eq [System.Text.Json.JsonValueKind]::String) { return $A.GetValue[string]().ToLowerInvariant() -eq $B.GetValue[string]().ToLowerInvariant() }
  if ($kindA -eq [System.Text.Json.JsonValueKind]::Number) { return $A.GetValue[double]() -eq $B.GetValue[double]() }
  return Test-J3w1NodeEqual $A $B
}

function New-J3w1Manifest {
  <# The record of one run. It names only the kit's own keys and files: no
     other Orca state and no secrets. observed[] holds the value (or
     absence) of every managed key as this run found it, whether or not the
     store was written, and the value the kit sets for it (kit; written, or
     asked of Orca through the GUI steps); equalsKit marks a value that
     already was the kit's. The font size is never set: it is recorded with
     the preserved keys. managedKeys names every key this run's maps manage,
     so a Restore with older maps still accepts them. #>
  param($Context, [string]$Operation, [string]$Timestamp, [string]$OrcaVersion, $ClaudeVersion, $Files, $Settings, $Observed, $Preserved, $Disclosures, [bool]$StoreWritten, [bool]$GhosttyBlockBefore, $FontSize)
  $pin = $Context.Pin
  $manifest = [System.Text.Json.Nodes.JsonObject]::new()
  $manifest['schemaVersion'] = New-J3w1JsonNode 1
  $manifest['kit'] = New-J3w1JsonNode $script:InstallerId
  $manifest['operation'] = New-J3w1JsonNode $Operation
  $manifest['timestamp'] = New-J3w1JsonNode $Timestamp
  $manifest['orcaVersion'] = New-J3w1JsonNode $OrcaVersion
  $manifest['claudeCodeVersion'] = if ($null -eq $ClaudeVersion) { $null } else { New-J3w1JsonNode $ClaudeVersion }
  $manifest['theme'] = New-J3w1JsonNode ([ordered]@{ name = $pin.Name; version = $pin.Version; ref = $pin.Ref; revision = $pin.Revision; profile = $pin.Profile })
  $manifest['source'] = New-J3w1JsonNode ([ordered]@{ kind = $Context.Export.SourceKind; pinVerified = [bool]$Context.Export.PinVerified })
  $manifest['storeWritten'] = New-J3w1JsonNode $StoreWritten
  $manifest['ghosttyBlockBefore'] = New-J3w1JsonNode $GhosttyBlockBefore
  $manifest['preferences'] = New-J3w1JsonNode ([ordered]@{ terminalFontSize = $FontSize })
  $managed = Get-J3w1ManagedKeys $Context.KitFiles
  $manifest['managedKeys'] = New-J3w1JsonNode @($managed)
  $manifest['files'] = [System.Text.Json.Nodes.JsonArray]::new()
  foreach ($file in $Files) {
    $manifest['files'].Add((New-J3w1JsonNode ([ordered]@{
      path = $file.Path; role = $file.Role; backupFile = $file.BackupFile
      existedBefore = $file.ExistedBefore; sha256Before = $file.Sha256Before; sha256After = $file.Sha256After
    })))
  }
  $manifest['observed'] = [System.Text.Json.Nodes.JsonArray]::new()
  foreach ($item in $Observed) {
    $entry = [System.Text.Json.Nodes.JsonObject]::new()
    $entry['key'] = New-J3w1JsonNode $item.Key
    $entry['value'] = if ($item.Slot.Present) { New-J3w1JsonNode $item.Slot.Node } else { Get-J3w1AbsentNode }
    $entry['equalsKit'] = New-J3w1JsonNode ([bool]$item.EqualsKit)
    $entry['kit'] = New-J3w1JsonNode $item.Kit
    $manifest['observed'].Add($entry)
  }
  $manifest['settings'] = [System.Text.Json.Nodes.JsonArray]::new()
  foreach ($change in $Settings) {
    $entry = [System.Text.Json.Nodes.JsonObject]::new()
    $entry['key'] = New-J3w1JsonNode $change.Key
    $entry['before'] = if ($change.Before.Present) { New-J3w1JsonNode $change.Before.Node } else { Get-J3w1AbsentNode }
    $entry['after'] = if ($change.After.Present) { New-J3w1JsonNode $change.After.Node } else { Get-J3w1AbsentNode }
    $manifest['settings'].Add($entry)
  }
  $manifest['preserved'] = [System.Text.Json.Nodes.JsonArray]::new()
  foreach ($item in $Preserved) {
    $entry = [System.Text.Json.Nodes.JsonObject]::new()
    $entry['key'] = New-J3w1JsonNode $item.Key
    $entry['value'] = if ($item.Slot.Present) { New-J3w1JsonNode $item.Slot.Node } else { Get-J3w1AbsentNode }
    $manifest['preserved'].Add($entry)
  }
  $manifest['disclosures'] = New-J3w1JsonNode @($Disclosures)
  $manifest['deviations'] = New-J3w1JsonNode @($Context.KitFiles.Roles.deviations)
  return , $manifest
}

function New-J3w1Lock {
  <# theme.lock.orca.json per schemas/json/theme.lock.schema.json. #>
  param($Context, [string]$Timestamp)
  $roles = $Context.KitFiles.Roles
  $pin = $Context.Pin
  $lock = [ordered]@{
    schemaVersion = 1
    theme = $pin.Name
    version = $pin.Version
    ref = $pin.Ref
    revision = $pin.Revision
    profile = $pin.Profile
    integration = [ordered]@{ id = $roles.integration.id; version = $roles.integration.version; kind = $roles.integration.kind }
    resolvedAt = $Timestamp
    exports = $Context.Export.Digests
    components = @($roles.components)
    deviations = @($roles.deviations)
  }
  return ConvertTo-J3w1JsonText (New-J3w1JsonNode $lock)
}

# ---------------------------------------------------------------------------
# Apply (and Update)
# ---------------------------------------------------------------------------

function Write-J3w1Header {
  param($Context, [string]$Title)
  $pin = $Context.Pin
  Write-Host "j3w1 theme installer: $Title"
  Write-Host "  theme        $($pin.Name) $($pin.Version) ($(Format-J3w1Pin $pin)), profile $($pin.Profile)"
  Write-Host "  export       $($Context.Export.Digests.Keys | Select-Object -First 1) $($Context.Export.Digests.Values | Select-Object -First 1) (digest verified; $($Context.Export.PinCheck))"
}

function Write-J3w1GuiSteps {
  Write-Host ''
  Write-Host 'Orca is running, so its settings store was not written (Orca would overwrite it).'
  Write-Host 'Finish in Orca:'
  Write-Host '  1. Settings > Terminal > Import from Ghostty > Apply Changes'
  Write-Host '  2. Settings > Terminal > Color Contrast > Off'
  Write-Host '  3. Settings > Appearance > Left Sidebar Appearance > Match Terminal'
  Write-Host 'or quit Orca (tray too) and rerun this script.'
}

function Write-J3w1Disclosures {
  param($Disclosures, $Deviations)
  Write-Host ''
  if (@($Disclosures).Count -gt 0) {
    Write-Host 'Disclosures (use-and-report roles; pending decisions, not approvals):'
    foreach ($item in $Disclosures) { Write-Host "  $($item.decisionId)  $($item.token)" }
  } else {
    Write-Host 'Disclosures: none'
  }
  Write-Host 'Deviations (what Orca cannot carry):'
  foreach ($deviation in $Deviations) {
    $applied = if ($null -eq $deviation.applied) { 'not applied' } else { "applied: $($deviation.applied)" }
    Write-Host "  [$($deviation.kind)] $($deviation.target): spec $($deviation.specValue); $applied. $($deviation.reason)"
  }
}

function Write-J3w1SettingDiff {
  param([string]$Key, $Before, $After)
  if ($After.Node -is [System.Text.Json.Nodes.JsonObject] -and ($Before.Present -and $Before.Node -is [System.Text.Json.Nodes.JsonObject] -or -not $Before.Present)) {
    Write-Host "  $Key"
    $names = [System.Collections.Generic.List[string]]::new()
    foreach ($pair in $After.Node) { $names.Add($pair.Key) }
    if ($Before.Present) { foreach ($pair in $Before.Node) { if (-not $names.Contains($pair.Key)) { $names.Add($pair.Key) } } }
    foreach ($name in $names) {
      $b = if ($Before.Present -and $Before.Node.ContainsKey($name)) { @{ Present = $true; Node = $Before.Node[$name] } } else { @{ Present = $false } }
      $a = if ($After.Node.ContainsKey($name)) { @{ Present = $true; Node = $After.Node[$name] } } else { @{ Present = $false } }
      $same = $b.Present -and $a.Present -and (Test-J3w1NodeEqual $b.Node $a.Node)
      $mark = if ($same) { '=' } else { '~' }
      Write-Host ("    {0} {1,-20} {2} -> {3}" -f $mark, $name, (Format-J3w1Value $b), (Format-J3w1Value $a))
    }
    return
  }
  $same = $Before.Present -and (Test-J3w1NodeEqual $Before.Node $After.Node)
  $mark = if ($same) { '=' } else { '~' }
  Write-Host ("  {0} {1,-30} {2} -> {3}" -f $mark, $Key, (Format-J3w1Value $Before), (Format-J3w1Value $After))
}

function Invoke-J3w1OrcaApply {
  <# The one write path for Apply and Update. Returns
     @{ Changed; StoreWritten; StorePending; BackupPath }. #>
  param($Context, [string]$Operation = 'apply', [switch]$PlanOnly, [switch]$SkipFontCheck, [switch]$ShowDiff)
  $environment = $Context.Environment
  $kitFiles = $Context.KitFiles
  $roles = $kitFiles.Roles

  Write-J3w1Header $Context "Orca ($Operation)"
  $orcaVersion = Get-J3w1OrcaVersion $environment
  $claudeVersion = Get-J3w1ClaudeVersion
  $targetNote = if ($roles.host.targetVersions -contains $orcaVersion) { 'supported' } else { 'NOT a target version' }
  Write-Host "  Orca         $orcaVersion ($targetNote; targets $($roles.host.targetVersions -join ', '))"
  Write-Host "  Claude Code  $(if ($null -eq $claudeVersion) { 'not found on PATH' } else { $claudeVersion })"
  if ($targetNote -ne 'supported') { Write-Warning "Orca $orcaVersion is not in the kit's target versions ($($roles.host.targetVersions -join ', ')); the settings keys were established for those." }

  $paths = Get-J3w1OrcaPaths $environment
  Write-Host "  profile      $($paths.ProfileId)"
  Write-Host "  settings     $($paths.Settings)"
  Write-Host "  ghostty      $($paths.Ghostty)"

  # The store is read for current values even while Orca runs; it is only
  # written when no Orca process exists.
  $storeBytes = [System.IO.File]::ReadAllBytes($paths.Settings)
  $store = Read-J3w1JsonNode $paths.Settings
  if ($store -isnot [System.Text.Json.Nodes.JsonObject] -or -not $store.ContainsKey('settings') -or $store['settings'] -isnot [System.Text.Json.Nodes.JsonObject]) {
    throw "$($paths.Settings) has no 'settings' object; is this an Orca settings file?"
  }
  $currentFont = Get-J3w1NodeAt $store 'terminalFontSize'
  $currentFontSize = $null
  if ($currentFont.Present -and $null -ne $currentFont.Node -and $currentFont.Node.GetValueKind() -eq [System.Text.Json.JsonValueKind]::Number) {
    $currentFontSize = $currentFont.Node.GetValue[double]()
    if ($currentFontSize -eq [math]::Floor($currentFontSize)) { $currentFontSize = [int64]$currentFontSize }
  }
  $expected = Get-J3w1Expected -KitFiles $kitFiles -Export $Context.Export -CurrentFontSize $currentFontSize

  $family = $expected.Settings['terminalFontFamily']
  if (Test-J3w1FontInstalled $environment $family) {
    Write-Host "  font         $family installed"
  } elseif ($SkipFontCheck) {
    Write-Warning "The terminal font '$family' was not found; continuing because of -SkipFontCheck. Orca will fall back to another font until it is installed."
  } else {
    throw (Get-J3w1FontFix $family)
  }

  # Settings: what changes, key by key.
  $changes = [System.Collections.Generic.List[object]]::new()
  foreach ($key in $expected.Settings.Keys) {
    $before = Get-J3w1NodeAt $store $key
    $after = @{ Present = $true; Node = (New-J3w1JsonNode $expected.Settings[$key]) }
    $changes.Add(@{ Key = $key; Before = $before; After = $after; Differs = -not ($before.Present -and (Test-J3w1NodeEqual $before.Node $after.Node)) })
  }
  # Every managed key as found, written or not: Restore needs the value
  # from before the kit even when Orca (running now) writes the kit's
  # values later through Import from Ghostty.
  $observed = foreach ($change in $changes) {
    @{ Key = $change.Key; Slot = $change.Before; Kit = $change.After.Node; EqualsKit = $change.Before.Present -and (Test-J3w1SameValue $change.Before.Node $change.After.Node) }
  }
  $pending = @($changes | Where-Object { $_.Differs })
  $running = Test-J3w1OrcaRunning $environment
  $writeStore = $pending.Count -gt 0 -and -not $running

  # Ghostty: the managed block in config.ghostty.
  $ghostty = Read-J3w1Ghostty $paths.Ghostty
  Assert-J3w1SingleBlock $ghostty
  $ghosttyBytes = Get-J3w1GhosttyUpdate -State $ghostty -Pin $Context.Pin -Expected $expected
  $writeGhostty = -not $ghostty.Exists -or -not [System.Linq.Enumerable]::SequenceEqual([byte[]]$ghostty.Bytes, [byte[]]$ghosttyBytes)

  # Preserved keys, the font size and the owner's expected preferences:
  # reported, never changed.
  $preserved = [System.Collections.Generic.List[object]]::new()
  foreach ($key in @($roles.orca.preserve) + @(Get-J3w1PreferenceKeys $kitFiles)) { $preserved.Add(@{ Key = $key; Slot = (Get-J3w1NodeAt $store $key) }) }

  Write-Host ''
  Write-Host 'Plan:'
  $ghosttyAction = if (-not $writeGhostty) { 'unchanged' } elseif ($null -ne $ghostty.Match) { 'replace the managed block' } elseif ($ghostty.Exists) { 'append the managed block (other lines kept)' } else { 'create with the managed block' }
  Write-Host "  config.ghostty: $ghosttyAction"
  if ($ShowDiff) {
    if ($writeGhostty) {
      $old = if ($null -ne $ghostty.Match) { $ghostty.Match.Value } else { '' }
      foreach ($line in (Compare-J3w1Lines (Get-J3w1GhosttyLines $old) $expected.GhosttyLines)) { Write-Host "    $line" }
    }
    foreach ($change in $changes) { Write-J3w1SettingDiff $change.Key $change.Before $change.After }
  } else {
    foreach ($change in $changes) {
      $state = if ($change.Differs) { "set to $(Format-J3w1Value $change.After)" } else { 'unchanged' }
      if ($change.Key -eq 'terminalColorOverrides' -and $change.Differs) { $state = "set ($($expected.Settings[$change.Key].Count) colours)" }
      Write-Host ("  {0,-30} {1}" -f $change.Key, $state)
    }
  }
  if ($pending.Count -gt 0 -and $running) { Write-Host '  store: NOT written (Orca is running)' }
  Write-Host ''
  Write-Host 'Preserved (never changed by the kit):'
  foreach ($item in $preserved) { Write-Host ("  {0,-40} {1}" -f $item.Key, (Format-J3w1Value $item.Slot)) }
  foreach ($key in $roles.orca.expectedPreferences.Keys) {
    $slot = Get-J3w1NodeAt $store $key
    $want = New-J3w1JsonNode $roles.orca.expectedPreferences[$key]
    if (-not ($slot.Present -and (Test-J3w1NodeEqual $slot.Node $want))) {
      Write-Warning "Expected preference $key = $(ConvertTo-J3w1Compact $want), found $(Format-J3w1Value $slot). The kit does not change it."
    }
  }
  foreach ($conflict in (Get-J3w1GhosttyConflicts $kitFiles $environment)) { Write-Warning "Ghostty conflict: $conflict." }
  Write-J3w1Disclosures $expected.Disclosures $roles.deviations

  $result = @{ Changed = $false; StoreWritten = $false; StorePending = ($pending.Count -gt 0 -and $running); BackupPath = $null }
  if (-not $writeStore -and -not $writeGhostty) {
    Write-Host ''
    Write-Host 'Result: no changes.'
    if ($result.StorePending) { Write-J3w1GuiSteps }
    return $result
  }
  if ($PlanOnly) {
    Write-Host ''
    Write-Host 'Result: -WhatIf, nothing written.'
    if ($result.StorePending) { Write-J3w1GuiSteps }
    return $result
  }

  # Plan and serialise everything first: a failure here leaves no backup
  # folder, no manifest and no changed file.
  $timestamp = Get-J3w1Timestamp
  $files = [System.Collections.Generic.List[object]]::new()
  $storeText = $null
  if ($writeStore) {
    foreach ($change in $pending) { Set-J3w1NodeAt $store $change.Key $change.After.Node }
    $storeText = ConvertTo-J3w1JsonText $store
    # No per-run copy of the store: the manifest keeps every managed key
    # before and after, and one full pre-kit copy is kept (see below).
    $files.Add(@{ Path = $paths.Settings; Role = 'store'; BackupFile = $null; ExistedBefore = $true; Sha256Before = (Get-J3w1Digest $storeBytes); Sha256After = (Get-J3w1Digest $script:Utf8.GetBytes($storeText)) })
  }
  if ($writeGhostty) {
    $backupFile = if ($ghostty.Exists) { 'config.ghostty' } else { $null }
    $files.Add(@{ Path = $paths.Ghostty; Role = 'ghostty'; BackupFile = $backupFile; ExistedBefore = $ghostty.Exists; Sha256Before = $(if ($ghostty.Exists) { Get-J3w1Digest $ghostty.Bytes } else { $null }); Sha256After = (Get-J3w1Digest $ghosttyBytes) })
  }
  $written = if ($writeStore) { $pending } else { @() }
  $manifest = New-J3w1Manifest -Context $Context -Operation $Operation -Timestamp $timestamp -OrcaVersion $orcaVersion -ClaudeVersion $claudeVersion `
    -Files $files -Settings $written -Observed $observed -Preserved $preserved -Disclosures $expected.Disclosures -StoreWritten:$writeStore `
    -GhosttyBlockBefore:($null -ne $ghostty.Match) -FontSize $expected.FontSize
  $manifestText = ConvertTo-J3w1JsonText $manifest
  $blockText = Get-J3w1GhosttyBlock -Pin $Context.Pin -Expected $expected
  # The lock claims the pin; a run whose pin was not verified writes none.
  $lockText = if ($Context.Export.PinVerified) { New-J3w1Lock -Context $Context -Timestamp $timestamp } else { $null }
  # One copy of the store as the first writing run read it, whether or not
  # this run writes the store (an Orca-open run does not, and Orca's Import
  # from Ghostty changes it later). Restore never takes it.
  $preKit = Get-J3w1PreKitStorePath $environment
  $savePreKit = -not (Test-Path -LiteralPath $preKit -PathType Leaf)
  if ($writeStore -and (Test-J3w1OrcaRunning $environment)) { throw 'Orca started during the run; nothing was written. Quit Orca (tray too) and rerun.' }

  # Back up, then write.
  $backup = New-J3w1BackupFolder $environment
  if ($savePreKit) { Write-J3w1Bytes -Path $preKit -Bytes $storeBytes }
  if ($writeGhostty -and $ghostty.Exists) { [System.IO.File]::WriteAllBytes((Join-J3w1Path $backup.Path 'config.ghostty'), $ghostty.Bytes) }
  Write-J3w1Text (Join-J3w1Path $backup.Path 'manifest.json') $manifestText

  if ($writeGhostty) { Write-J3w1Bytes -Path $paths.Ghostty -Bytes $ghosttyBytes }
  if ($writeStore) {
    if (Test-J3w1OrcaRunning $environment) { throw 'Orca started during the run; the store was not written. Quit Orca (tray too) and rerun.' }
    Write-J3w1Text $paths.Settings $storeText
  }
  $current = Join-J3w1Path $environment.StateRoot 'current'
  Write-J3w1Text (Join-J3w1Path $current 'manifest.json') $manifestText
  Write-J3w1Text (Join-J3w1Path $current 'config.ghostty.block') $blockText
  $lockPath = Join-J3w1Path $current 'theme.lock.orca.json'
  if ($null -ne $lockText) { Write-J3w1Text $lockPath $lockText } else { Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue }

  $result.Changed = $true
  $result.StoreWritten = $writeStore
  $result.BackupPath = $backup.Path
  Write-Host ''
  Write-Host "Result: applied. Backup: $($backup.Path)"
  if ($writeStore) { Write-Host 'Orca settings written; start Orca to see the terminal colours.' }
  if ($savePreKit) { Write-Host "One full copy of Orca's store as this run read it, before any kit write (it holds the whole private store; kept once, never overwritten): $preKit" }
  if ($null -eq $lockText) { Write-Host 'The pin was not verified (working tree source), so no theme.lock.orca.json was written.' }
  if ($result.StorePending) { Write-J3w1GuiSteps }
  if ($ghostty.Exists -eq $false -or $writeGhostty) { Write-Host "Ghostty block: $($paths.Ghostty)" }
  return $result
}

function Invoke-J3w1OrcaUpdate {
  <# Moves to another release: the tag resolves to its commit (the GitHub
     API, or git in -SourceRoot), and that commit's own Get-J3w1Orca.ps1
     downloads that commit's installer and export, verifies them, applies
     with a before/after diff and runs the checks. Tags before v3.0.0 carry
     no installer and are refused. Never follows a branch. Returns the
     process exit code. #>
  param([string]$Version, [string]$SourceRoot, [switch]$PlanOnly, [switch]$SkipFontCheck)
  if ($Version -notmatch $script:TagPattern) {
    throw "-Version must be an exact release tag such as $($script:FirstInstallerTag); '$Version' is refused (branches, 'main' and 'latest' are never followed)."
  }
  if (-not (Test-J3w1TagAtLeast $Version $script:FirstInstallerTag)) {
    throw "$Version predates this installer ($($script:FirstInstallerTag) and later have ports/orca/install). To take the theme out, run Restore-J3w1OrcaTheme.ps1; to install $Version, use the terminal kit from that release (tools/terminal-kit/windows at $Version)."
  }
  $environment = Get-J3w1Environment
  $fromGit = -not [string]::IsNullOrWhiteSpace($SourceRoot)
  if ($fromGit -and $environment.SourceWorktree) { throw 'Update reads git objects at the tag only; unset J3W1_KIT_TEST_SOURCE.' }
  if ($fromGit) {
    $SourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
    if ($null -eq (Get-J3w1GitText @('-C', $SourceRoot, 'rev-parse', '--git-dir'))) { throw "-SourceRoot $SourceRoot is not a git clone of $($script:Repository)." }
  }
  $revision = Resolve-J3w1TagRevision -Environment $environment -Ref $Version -SourceRoot $SourceRoot
  if ($revision -cnotmatch '^[0-9a-f]{40}$') { throw "Tag $Version did not resolve to a commit ($revision)." }
  $getPath = 'ports/orca/install/Get-J3w1Orca.ps1'
  if ($fromGit) {
    Write-Warning "Tag $Version is trusted as a local tag: $revision comes from the tag in $SourceRoot. Check it against $($script:Repository) on GitHub if in doubt."
    $bytes = Invoke-J3w1Git -Arguments @('-C', $SourceRoot, 'cat-file', 'blob', "${revision}:$getPath") -AllowFailure
  } else {
    $bytes = Invoke-J3w1Http -Environment $environment -Url "https://raw.githubusercontent.com/$($script:Repository)/$revision/$getPath" -AllowNotFound
  }
  if ($null -eq $bytes) {
    throw "Tag $Version ($revision) has no $getPath, so it predates this installer. To take the theme out, run Restore-J3w1OrcaTheme.ps1; to install $Version, use the terminal kit from that release."
  }
  $where = if ($fromGit) { "git in $SourceRoot" } else { 'the GitHub API' }
  Write-Host "Update to $Version = $revision (resolved through $where); running that commit's Get-J3w1Orca.ps1."
  # That commit's code runs in its own PowerShell process, so this release's
  # module never mixes with the new one.
  $script = Join-Path ([System.IO.Path]::GetTempPath()) "j3w1-get-$revision-$PID.ps1"
  [System.IO.File]::WriteAllBytes($script, $bytes)
  try {
    $arguments = @('-NoProfile', '-NonInteractive', '-File', $script, '-Revision', $revision, '-Apply', '-Update', '-Tag', $Version)
    if ($fromGit) { $arguments += @('-SourceRoot', $SourceRoot) }
    if ($SkipFontCheck) { $arguments += '-SkipFontCheck' }
    if ($PlanOnly) { $arguments += '-WhatIf' }
    & ([System.Environment]::ProcessPath) @arguments | Out-Host
    return $LASTEXITCODE
  } finally {
    Remove-Item -LiteralPath $script -Force -ErrorAction SilentlyContinue -WhatIf:$false
  }
}

function New-J3w1VerifyContext {
  <# Test checks what was last applied: the commit the current manifest
     names. When that is not the commit these scripts came from, its release
     folder (or, in a clone, its git objects) supplies the host map, the
     specimen and the export. The export must also match the digest the last
     apply recorded in its lock. #>
  param([string]$KitRoot)
  $environment = Get-J3w1Environment
  $own = Get-J3w1Source -Environment $environment -KitRoot $KitRoot
  $manifest = Get-J3w1CurrentManifest $environment
  if ($null -eq $manifest) { return New-J3w1Context -Source $own }
  $theme = $manifest['theme']
  $revision = $theme['revision'].ToString()
  $ref = $theme['ref'].ToString()
  $source = $own
  if ($revision -ne $own.Revision) {
    $folder = Join-J3w1Path $environment.Releases $revision
    if (Test-Path -LiteralPath (Join-J3w1Path $folder 'release.json') -PathType Leaf) {
      $source = Get-J3w1Source -Environment $environment -KitRoot $folder
    } elseif ($own.Kind -eq 'git' -and $null -ne (Invoke-J3w1Git -Arguments @('-C', $own.Root, 'cat-file', '-e', "$revision^{commit}") -AllowFailure)) {
      $source = @{ Kind = 'git'; Root = $own.Root; Revision = $revision; Ref = $(if ($ref -match $script:TagPattern) { $ref } else { $revision }); Verified = $true; Label = "clone $($own.Root) (git objects at $revision)" }
    } else {
      $name = if ($ref -eq $revision) { "commit $revision" } else { "$ref ($revision)" }
      throw "The last apply installed $name, which is not downloaded here. Run Get-J3w1Orca.ps1 -Revision $revision to check it, or apply this release ($($own.Revision)) first."
    }
    Write-Host "Checking the last apply ($(Format-J3w1Pin @{ Ref = $source.Ref; Revision = $revision })), not this folder's commit ($($own.Revision))."
  }
  $recorded = $null
  $lockPath = Join-J3w1Path $environment.StateRoot 'current/theme.lock.orca.json'
  if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
    $lock = Read-J3w1Data $lockPath
    $digest = [string]$lock.exports[$script:TokensPath]
    if ($lock.revision -eq $revision -and $digest) { $recorded = @{ Digest = $digest; Source = 'the last apply (theme.lock.orca.json)' } }
  }
  return New-J3w1Context -Source $source -PinnedDigest $recorded
}

# ---------------------------------------------------------------------------
# Test: programmatic checks and the specimen
# ---------------------------------------------------------------------------

function Get-J3w1Rgb {
  param([string]$Hex)
  return @([Convert]::ToInt32($Hex.Substring(1, 2), 16), [Convert]::ToInt32($Hex.Substring(3, 2), 16), [Convert]::ToInt32($Hex.Substring(5, 2), 16))
}

function Get-J3w1Contrast {
  <# WCAG 2 contrast ratio of two sRGB colours. #>
  param([string]$A, [string]$B)
  $luminance = {
    param($hex)
    $sum = 0.0
    $weights = @(0.2126, 0.7152, 0.0722)
    $rgb = Get-J3w1Rgb $hex
    for ($i = 0; $i -lt 3; $i++) {
      $c = $rgb[$i] / 255.0
      $linear = if ($c -le 0.04045) { $c / 12.92 } else { [math]::Pow(($c + 0.055) / 1.055, 2.4) }
      $sum += $weights[$i] * $linear
    }
    $sum
  }
  $la = & $luminance $A
  $lb = & $luminance $B
  $hi = [math]::Max($la, $lb)
  $lo = [math]::Min($la, $lb)
  return ($hi + 0.05) / ($lo + 0.05)
}

function Format-J3w1Ratio {
  param([double]$Ratio)
  return $Ratio.ToString('0.00', [cultureinfo]::InvariantCulture)
}

function Get-J3w1Sgr {
  param([string[]]$Codes)
  if (@($Codes).Count -eq 0) { return "$($script:Esc)[0m" }
  return "$($script:Esc)[0;$($Codes -join ';')m"
}

function Get-J3w1SlotCode {
  param($Slot, [switch]$Background)
  if ($Slot -is [string] -and $Slot -eq 'default') { return $(if ($Background) { '49' } else { '39' }) }
  $n = [int]$Slot
  if ($n -lt 0 -or $n -gt 15) { throw "Specimen slot out of range: $n" }
  $base = if ($n -lt 8) { 30 + $n } else { 90 + $n - 8 }
  if ($Background) { $base += 10 }
  return [string]$base
}

function Get-J3w1TrueColor {
  param([string]$Hex, [switch]$Background)
  $rgb = Get-J3w1Rgb $Hex
  $lead = if ($Background) { '48' } else { '38' }
  return "$lead;2;$($rgb[0]);$($rgb[1]);$($rgb[2])"
}

function Show-J3w1Specimen {
  <# Renders specimen.json: ANSI slots as SGR 30-37/90-97 and 40-47/100-107,
     tokens and Claude Code roles as 24-bit colour. #>
  param($Context, [System.Collections.Generic.List[object]]$Disclosures)
  $kitFiles = $Context.KitFiles
  $export = $Context.Export
  $specimen = $kitFiles.Specimen
  $attributeCodes = [ordered]@{ bold = '1'; dim = '2'; italic = '3'; underline = '4'; inverse = '7'; strike = '9' }
  $slotNames = @{}
  foreach ($name in $kitFiles.Roles.orca.terminalColorOverrides.Keys) {
    if ($kitFiles.Roles.orca.terminalColorOverrides[$name] -match '^color\.terminal\.ansi\.(\d+)$') { $slotNames[[int]$Matches[1]] = $name }
  }
  $slotHex = @{}
  for ($n = 0; $n -lt 16; $n++) { $slotHex[$n] = Resolve-J3w1Token $export "color.terminal.ansi.$n" '' $Disclosures }
  $terminalBg = Resolve-J3w1Token $export 'color.terminal.bg' '' $Disclosures
  $terminalFg = Resolve-J3w1Token $export 'color.terminal.fg' '' $Disclosures
  $cross = [string][char]0x2715
  $reset = "$($script:Esc)[0m"

  Write-Host ''
  Write-Host "Specimen (expected: terminal fg $terminalFg on bg $terminalBg; compare the colours you see with the hex beside them)"
  foreach ($section in $specimen.sections) {
    Write-Host ''
    Write-Host "== $($section.title)"
    if ($section.Contains('generated')) {
      switch ($section.generated) {
        'slot-grid' {
          for ($n = 0; $n -lt 16; $n++) {
            $ratio = Get-J3w1Contrast $slotHex[$n] $terminalBg
            $flag = if ($ratio -lt 4.5) { $cross } else { ' ' }
            $sample = (Get-J3w1Sgr @((Get-J3w1SlotCode $n))) + ' The quick brown fox ' + $reset
            $block = (Get-J3w1Sgr @((Get-J3w1SlotCode $n -Background))) + '        ' + $reset
            Write-Host ("  {0,2} {1,-14}{2} {3}  {4}  {5,5}:1 {6}" -f $n, $slotNames[$n], $sample, $block, $slotHex[$n], (Format-J3w1Ratio $ratio), $flag)
          }
          Write-Host "  contrast is against the terminal background; $cross marks below 4.5:1"
        }
        'attributes' {
          $parts = foreach ($name in $attributeCodes.Keys) { (Get-J3w1Sgr @($attributeCodes[$name])) + $name + $reset }
          Write-Host ('  ' + ($parts -join '  '))
        }
        'bg-pairs' {
          for ($n = 0; $n -lt 16; $n++) {
            $ratio = Get-J3w1Contrast $terminalFg $slotHex[$n]
            $flag = if ($ratio -lt 4.5) { $cross } else { ' ' }
            $sample = (Get-J3w1Sgr @('39', (Get-J3w1SlotCode $n -Background))) + " default fg on slot $n " + $reset
            Write-Host ("  {0,2} {1}  {2}  {3,5}:1 {4}" -f $n, $sample, $slotHex[$n], (Format-J3w1Ratio $ratio), $flag)
          }
        }
        default { Write-Host "  (unknown generated section '$($section.generated)')" }
      }
      continue
    }
    foreach ($line in $section.lines) {
      $text = '  '
      foreach ($segment in $line) {
        $codes = [System.Collections.Generic.List[string]]::new()
        if ($segment.Contains('attrs')) { foreach ($attr in $segment.attrs) { if ($attributeCodes.Contains($attr)) { $codes.Add($attributeCodes[$attr]) } } }
        if ($segment.Contains('fg')) { $codes.Add((Get-J3w1SlotCode $segment.fg)) }
        if ($segment.Contains('bg')) { $codes.Add((Get-J3w1SlotCode $segment.bg -Background)) }
        if ($segment.Contains('fgToken')) { $codes.Add((Get-J3w1TrueColor (Resolve-J3w1Token $export $segment.fgToken '' $Disclosures))) }
        if ($segment.Contains('bgToken')) { $codes.Add((Get-J3w1TrueColor (Resolve-J3w1Token $export $segment.bgToken '' $Disclosures) -Background)) }
        foreach ($key in 'fgRole', 'bgRole', 'fgScope', 'bgScope') {
          if ($segment.Contains($key)) { throw "The specimen still names $key; it is generated with every role resolved (npm run generate)." }
        }
        $text += (Get-J3w1Sgr $codes) + $segment.text
      }
      Write-Host ($text + $reset)
    }
  }
}

function Invoke-J3w1OrcaVerify {
  <# Programmatic checks, each PASS, FAIL, WARN or SKIP with what was
     observed. Returns the number of FAILs. #>
  param($Context, [switch]$NoSpecimen)
  $environment = $Context.Environment
  $kitFiles = $Context.KitFiles
  $roles = $kitFiles.Roles
  $manifest = Get-J3w1CurrentManifest $environment
  $results = [System.Collections.Generic.List[object]]::new()
  $add = { param($status, $name, $detail) $results.Add(@{ Status = $status; Name = $name; Detail = $detail }) }

  Write-J3w1Header $Context 'Orca (test)'
  $paths = Get-J3w1OrcaPaths $environment
  $store = Read-J3w1JsonNode $paths.Settings
  $running = Test-J3w1OrcaRunning $environment

  $fontSize = $null
  if ($null -ne $manifest) {
    $preference = $manifest['preferences']
    if ($null -ne $preference -and $null -ne $preference['terminalFontSize']) {
      $fontSize = $preference['terminalFontSize'].GetValue[double]()
      if ($fontSize -eq [math]::Floor($fontSize)) { $fontSize = [int64]$fontSize }
    }
  } else {
    $slot = Get-J3w1NodeAt $store 'terminalFontSize'
    if ($slot.Present -and $slot.Node.GetValueKind() -eq [System.Text.Json.JsonValueKind]::Number) {
      $fontSize = $slot.Node.GetValue[double]()
      if ($fontSize -eq [math]::Floor($fontSize)) { $fontSize = [int64]$fontSize }
    }
  }
  $expected = Get-J3w1Expected -KitFiles $kitFiles -Export $Context.Export -CurrentFontSize $fontSize
  if ($null -eq $manifest) { & $add 'SKIP' 'last apply' "no manifest under $(Join-J3w1Path $environment.StateRoot 'current'); run Apply first" }
  if ($running) { & $add 'WARN' 'Orca running' 'the file may differ from what Orca holds in memory; Orca writes it on its next change' }

  # Ghostty block.
  $ghostty = Read-J3w1Ghostty $paths.Ghostty
  if ($ghostty.Blocks -gt 1) { & $add 'FAIL' 'ghostty block count' "$($ghostty.Blocks) managed blocks in $($paths.Ghostty); delete the extra copies" }
  if ($null -eq $ghostty.Match) {
    & $add 'FAIL' 'ghostty block' "no managed block in $($paths.Ghostty)"
  } else {
    # font-size is the owner's preference, not a theme value: not compared.
    $isSize = { param($line) $line -like 'font-size = *' }
    $blockLines = Get-J3w1GhosttyLines $ghostty.Match.Value
    $found = @($blockLines | Where-Object { -not (& $isSize $_) })
    $want = @($expected.GhosttyLines | Where-Object { -not (& $isSize $_) })
    $diff = @(Compare-J3w1Lines $found $want)
    if ($diff.Count -eq 0) { & $add 'PASS' 'ghostty block' "$($want.Count) lines equal the generated text (font-size not compared)" }
    else { & $add 'FAIL' 'ghostty block' ("differs (- found, + expected): " + ($diff -join '; ')) }
  }
  $conflicts = Get-J3w1GhosttyConflicts $kitFiles $environment
  if ($conflicts.Count -eq 0) { & $add 'PASS' 'ghostty overrides' 'no later theme keys in config.ghostty or config' }
  else { & $add 'FAIL' 'ghostty overrides' ($conflicts -join '; ') }

  # Store values.
  $overrides = Get-J3w1NodeAt $store 'terminalColorOverrides'
  if (-not $overrides.Present -or $overrides.Node -isnot [System.Text.Json.Nodes.JsonObject]) {
    & $add 'FAIL' 'terminalColorOverrides' "observed $(Format-J3w1Value $overrides)"
  } else {
    $bad = [System.Collections.Generic.List[string]]::new()
    $want = $expected.Settings['terminalColorOverrides']
    foreach ($name in $want.Keys) {
      $node = if ($overrides.Node.ContainsKey($name)) { $overrides.Node[$name] } else { $null }
      $value = if ($null -eq $node) { '(absent)' } else { $node.ToString().ToLowerInvariant() }
      if ($value -ne $want[$name]) { $bad.Add("$name=$value (expected $($want[$name]))") }
    }
    foreach ($pair in $overrides.Node) { if (-not $want.Contains($pair.Key)) { $bad.Add("unexpected $($pair.Key)") } }
    if ($bad.Count -eq 0) { & $add 'PASS' 'terminalColorOverrides' "$($want.Count) colours equal the export" }
    else { & $add 'FAIL' 'terminalColorOverrides' ($bad -join '; ') }
  }
  $preferences = @(Get-J3w1PreferenceKeys $kitFiles)
  foreach ($key in $roles.orca.settings.Keys) {
    $slot = Get-J3w1NodeAt $store $key
    if ($preferences -contains $key) {
      # Never set by the kit; the owner may change it at any time.
      $then = if ($null -eq $fontSize) { '(absent)' } else { Format-J3w1Number $fontSize }
      $ok = if ($null -eq $fontSize) { -not $slot.Present } else { $slot.Present -and $null -ne $slot.Node -and $slot.Node.GetValueKind() -eq [System.Text.Json.JsonValueKind]::Number -and $slot.Node.GetValue[double]() -eq $fontSize }
      $detail = "observed $(Format-J3w1Value $slot), $then at the last apply; never set by the kit"
      if (-not $ok) { $detail += '; changed since, which the kit allows (the size is yours)' }
      & $add $(if ($ok) { 'PASS' } else { 'WARN' }) $key $detail
      continue
    }
    $want = New-J3w1JsonNode $expected.Settings[$key]
    $ok = $slot.Present -and $null -ne $slot.Node
    if ($ok) {
      if ($want.GetValueKind() -eq [System.Text.Json.JsonValueKind]::Number) {
        $ok = $slot.Node.GetValueKind() -eq [System.Text.Json.JsonValueKind]::Number -and $slot.Node.GetValue[double]() -eq $want.GetValue[double]()
      } else {
        $ok = $slot.Node.GetValueKind() -eq $want.GetValueKind() -and $slot.Node.ToString().ToLowerInvariant() -eq $want.ToString().ToLowerInvariant()
      }
    }
    & $add $(if ($ok) { 'PASS' } else { 'FAIL' }) $key "observed $(Format-J3w1Value $slot), expected $(ConvertTo-J3w1Compact $want)"
  }

  # Preserved keys against the last manifest, and the owner's preferences.
  if ($null -ne $manifest) {
    $changed = [System.Collections.Generic.List[string]]::new()
    foreach ($entry in $manifest['preserved']) {
      $key = $entry['key'].ToString()
      if ($preferences -contains $key) { continue }
      $slot = Get-J3w1NodeAt $store $key
      $then = $entry['value']
      $same = if (Test-J3w1AbsentNode $then) { -not $slot.Present } else { $slot.Present -and (Test-J3w1NodeEqual $slot.Node $then) }
      if (-not $same) { $changed.Add("$key $(ConvertTo-J3w1Compact $then) -> $(Format-J3w1Value $slot)") }
    }
    if ($changed.Count -eq 0) { & $add 'PASS' 'preserved keys' "$(@($manifest['preserved'] | Where-Object { $preferences -notcontains $_['key'].ToString() }).Count) keys unchanged since the last apply" }
    else { & $add 'FAIL' 'preserved keys' ($changed -join '; ') }
  } else {
    & $add 'SKIP' 'preserved keys' 'no manifest to compare with'
  }
  foreach ($key in $roles.orca.expectedPreferences.Keys) {
    $slot = Get-J3w1NodeAt $store $key
    $want = New-J3w1JsonNode $roles.orca.expectedPreferences[$key]
    $ok = $slot.Present -and (Test-J3w1NodeEqual $slot.Node $want)
    & $add $(if ($ok) { 'PASS' } else { 'WARN' }) "preference $key" "observed $(Format-J3w1Value $slot), owner expects $(ConvertTo-J3w1Compact $want)"
  }
  $family = $expected.Settings['terminalFontFamily']
  & $add $(if (Test-J3w1FontInstalled $environment $family) { 'PASS' } else { 'WARN' }) 'font installed' $family

  Write-Host ''
  Write-Host 'Checks:'
  foreach ($r in $results) { Write-Host ("  {0,-4}  {1,-32} {2}" -f $r.Status, $r.Name, $r.Detail) }
  $fails = @($results | Where-Object { $_.Status -eq 'FAIL' }).Count
  $counts = foreach ($s in 'PASS', 'FAIL', 'WARN', 'SKIP') { "$(@($results | Where-Object { $_.Status -eq $s }).Count) $s" }

  $disclosures = [System.Collections.Generic.List[object]]::new()
  foreach ($item in $expected.Disclosures) { $disclosures.Add($item) }
  if (-not $NoSpecimen) { Show-J3w1Specimen -Context $Context -Disclosures $disclosures }
  Write-J3w1Disclosures $disclosures $roles.deviations
  Write-Host ''
  Write-Host "Result: $($counts -join ', ')"
  return $fails
}

# ---------------------------------------------------------------------------
# Restore
# ---------------------------------------------------------------------------

function Get-J3w1Backups {
  <# Every backup folder with a manifest, oldest first. Folders are named
     yyyyMMddTHHmmssZ, with -1, -2 ... for runs within the same second. #>
  param($Environment)
  $root = Join-J3w1Path $Environment.StateRoot 'backups'
  $list = [System.Collections.Generic.List[object]]::new()
  if (-not (Test-Path -LiteralPath $root)) { return , $list }
  $order = @(
    @{ Expression = { ($_.Name -split '-', 2)[0] } },
    @{ Expression = { $parts = $_.Name -split '-', 2; if ($parts.Count -gt 1 -and $parts[1] -match '^\d+$') { [int]$parts[1] } else { 0 } } }
  )
  foreach ($dir in (Get-ChildItem -LiteralPath $root -Directory | Sort-Object -Property $order)) {
    $manifestPath = Join-J3w1Path $dir.FullName 'manifest.json'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { continue }
    $list.Add(@{ Name = $dir.Name; Path = $dir.FullName; Manifest = (Read-J3w1JsonNode $manifestPath) })
  }
  return , $list
}

function Get-J3w1ManifestText {
  param($Manifest, [string]$Name)
  $node = $Manifest[$Name]
  if ($null -eq $node) { return $null }
  return $node.ToString()
}

function Get-J3w1ManifestBool {
  param($Manifest, [string]$Name, [bool]$Default)
  $node = $Manifest[$Name]
  if ($null -eq $node) { return $Default }
  return $node.GetValue[bool]()
}

function Test-J3w1RunManifest {
  param($Manifest)
  return @('apply', 'update') -contains $Manifest['operation'].ToString()
}

function Test-J3w1Boundary {
  <# A restore after which no kit value was left applied: it finished its
     last write (complete) and returned every key the kit touched to a state
     from before the kit (boundary). Restore manifests from before these
     fields count when they were default restores that were not refused. #>
  param($Manifest)
  if ($Manifest['operation'].ToString() -ne 'restore') { return $false }
  if ($null -ne $Manifest['complete']) {
    return (Get-J3w1ManifestBool $Manifest 'complete' $false) -and (Get-J3w1ManifestBool $Manifest 'boundary' $false)
  }
  return (@($null, 'default') -contains (Get-J3w1ManifestText $Manifest 'mode')) -and -not (Get-J3w1ManifestBool $Manifest 'refused' $false)
}

function Get-J3w1ManifestKeys {
  <# What one manifest says about each managed key: Before (the value the
     run found; the absent marker for a missing key), After (the value the
     kit left, or asked Orca for through the GUI steps; $null when not
     recorded), EqualsKit, Written (the run wrote it to the store) and Asked
     (a run that could not write the store found it at a value other than
     the kit's). Manifests from before observed[] give settings[] only. #>
  param($Manifest)
  $isRun = Test-J3w1RunManifest $Manifest
  $storeWritten = Get-J3w1ManifestBool $Manifest 'storeWritten' $false
  $map = [ordered]@{}
  if ($null -ne $Manifest['observed']) {
    foreach ($entry in $Manifest['observed']) {
      $equalsKit = $entry['equalsKit'].GetValue[bool]()
      $map[$entry['key'].ToString()] = @{ Before = $entry['value']; After = $entry['kit']; EqualsKit = $equalsKit; Written = $false; Asked = $isRun -and -not $storeWritten -and -not $equalsKit }
    }
  }
  if ($null -ne $Manifest['settings']) {
    foreach ($entry in $Manifest['settings']) {
      $key = $entry['key'].ToString()
      if (-not $map.Contains($key)) { $map[$key] = @{ Before = $entry['before']; After = $null; EqualsKit = $false; Written = $false; Asked = $false } }
      if ($storeWritten) {
        $map[$key].Written = $true
        $map[$key].After = $entry['after']
      }
    }
  }
  return $map
}

function Format-J3w1Node {
  param($Node)
  if (Test-J3w1AbsentNode $Node) { return '(absent)' }
  return ConvertTo-J3w1Compact $Node
}

function Get-J3w1GhosttyRestorePlan {
  <# What config.ghostty gets back. $Target is the file before the chosen
     run ($null when no run in the window wrote it). Without a block to put
     back, only the managed block is removed and every byte outside it is
     kept; the target's exact bytes (or the deletion of a file the kit
     created) are used only when nothing outside the block changed since. #>
  param($Current, $Target, [switch]$KeepTargetBlock)
  if (-not $Current.Exists) {
    if ($null -ne $Target -and $Target.Exists) { return @{ Action = 'gone'; Note = 'missing now; left missing (it was removed after the kit wrote it)' } }
    return @{ Action = 'none' }
  }
  $rest = Get-J3w1GhosttyText $Current $null
  $targetBlock = if ($KeepTargetBlock -and $null -ne $Target -and $null -ne $Target.Match) { $Target.Match.Value } else { $null }
  if ($null -ne $targetBlock) {
    if ($rest -ceq (Get-J3w1GhosttyText $Target $null)) {
      $plan = @{ Action = 'write'; Bytes = $Target.Bytes; Note = 'restore the backed-up bytes (nothing outside the managed block changed)' }
    } else {
      $plan = @{ Action = 'write'; Bytes = (ConvertTo-J3w1GhosttyBytes $Current (Get-J3w1GhosttyText $Current $targetBlock)); Note = "put back the backup's managed block; every other line is kept" }
    }
  } elseif ($null -ne $Target -and $null -eq $Target.Match -and $rest -ceq (Get-J3w1GhosttyText $Target '')) {
    if ($Target.Exists) {
      $plan = @{ Action = 'write'; Bytes = $Target.Bytes; Note = 'restore the pre-kit bytes (nothing outside the managed block changed)' }
    } else {
      $plan = @{ Action = 'delete'; Note = 'delete (the kit created it and nothing else was added)' }
    }
  } else {
    $plan = @{ Action = 'write'; Bytes = (ConvertTo-J3w1GhosttyBytes $Current $rest); Note = 'remove the managed block; every byte outside it is kept' }
  }
  if ($plan.Action -eq 'write' -and [System.Linq.Enumerable]::SequenceEqual([byte[]]$Current.Bytes, [byte[]]$plan.Bytes)) { return @{ Action = 'none' } }
  return $plan
}

function Invoke-J3w1OrcaRestore {
  <# Key-level restore over a window of records (apply, update and restore
     manifests, oldest first):
       default  every record since the last restore that left no kit value
                applied (a boundary), or since the first run;
       -Latest  the most recent apply or update and everything after it;
       -Backup  the named backup and everything after it.
     Per key the earliest value recorded in the window comes back, but only
     for a key a record in the window wrote, or that a run which could not
     write the store (Orca open) found at a value other than the kit's. The
     font size is never touched, except where a record from an earlier kit
     version wrote it: then it comes back unless the owner changed it since.
     A key whose earliest record already held the kit's value while
     config.ghostty held the managed block (or that the previous boundary
     left unknown) may have been written by Orca's Import from Ghostty; its
     pre-kit value is unknown, so it is left as it is and the run exits 3.
     config.ghostty returns to its state before the earliest record in the
     window that wrote it; with no such record the default removes the
     managed block and -Latest/-Backup leave the file alone.
     The restore's manifest is written first with complete=false and marked
     complete only after its last write, so an interrupted restore is never
     a boundary and rerunning it finishes the job. The store is written only
     while Orca is not running (exit 2 otherwise). #>
  param($Environment, $KitFiles, [string]$Backup, [switch]$Latest, [switch]$PlanOnly)
  $backups = Get-J3w1Backups $Environment
  $runs = @(for ($i = 0; $i -lt $backups.Count; $i++) { if (Test-J3w1RunManifest $backups[$i].Manifest) { $i } })
  if ($runs.Count -eq 0) { throw "No kit backups under $(Join-J3w1Path $Environment.StateRoot 'backups'); nothing to restore." }
  $lastBoundary = {
    param([int]$Before)
    for ($i = $Before - 1; $i -ge 0; $i--) { if (Test-J3w1Boundary $backups[$i].Manifest) { return $i } }
    return -1
  }
  $mode = 'default'
  $since = $null
  if ($Backup) {
    $start = -1
    for ($i = 0; $i -lt $backups.Count; $i++) { if ($backups[$i].Name -eq $Backup) { $start = $i } }
    if ($start -lt 0) { throw "No backup named '$Backup'. Available: $(($backups | ForEach-Object { $_.Name }) -join ', ')" }
    $mode = 'backup'
    $label = "the state before backup $Backup"
  } elseif ($Latest) {
    $start = $runs[-1]
    $mode = 'latest'
    $label = "the state before the latest apply or update ($($backups[$start].Name))"
  } else {
    $previous = & $lastBoundary $backups.Count
    $start = $previous + 1
    if ($previous -ge 0) { $since = $backups[$previous].Name }
    $label = if ($since) { "the state before the kit's first change since the restore $since" } else { "the state before the kit's first change" }
  }
  $window = @(for ($i = $start; $i -lt $backups.Count; $i++) { $backups[$i] })
  if ($mode -eq 'default') { $label += " ($($window.Count) record(s))" }
  # The window reaches back to a state with no kit value applied when no run
  # lies between the boundary before it and its start; only then is the
  # restore itself a boundary, and only then can a pre-kit value be unknown.
  $previous = & $lastBoundary $start
  $clean = $true
  for ($i = $previous + 1; $i -lt $start; $i++) { if (Test-J3w1RunManifest $backups[$i].Manifest) { $clean = $false } }
  $carried = @()
  if ($clean -and $previous -ge 0 -and $null -ne $backups[$previous].Manifest['unknown']) {
    $carried = @($backups[$previous].Manifest['unknown'] | ForEach-Object { $_.ToString() })
  }

  $paths = Get-J3w1OrcaPaths $Environment
  $running = Test-J3w1OrcaRunning $Environment
  Write-Host 'j3w1 theme installer: Orca (restore)'
  Write-Host "  target       $label"
  Write-Host "  settings     $($paths.Settings)"
  if ($window.Count -eq 0) {
    Write-Host ''
    Write-Host "Result: nothing to restore; no apply or update since the restore $since."
    return 0
  }

  $managed = Get-J3w1ManagedKeys $KitFiles
  $preferences = @(Get-J3w1PreferenceKeys $KitFiles)
  foreach ($item in $backups) { $item.Info = Get-J3w1ManifestKeys $item.Manifest }

  # Per key: the earliest record in the window, and whether the kit touched it.
  $keys = [ordered]@{}
  foreach ($item in $window) {
    $blockBefore = Get-J3w1ManifestBool $item.Manifest 'ghosttyBlockBefore' $false
    # Records from earlier kit versions may name the font size.
    $accepted = @($managed) + $preferences
    if ($null -ne $item.Manifest['managedKeys']) { $accepted += @($item.Manifest['managedKeys'] | ForEach-Object { $_.ToString() }) }
    foreach ($key in $item.Info.Keys) {
      if ($accepted -notcontains $key) { throw "Backup $($item.Name) names '$key', which neither this kit nor that run's maps manage. Refusing." }
      $record = $item.Info[$key]
      if (-not $keys.Contains($key)) { $keys[$key] = @{ Value = $record.Before; EqualsKit = $record.EqualsKit; BlockBefore = $blockBefore; From = $item.Name; Touched = $false } }
      if ($record.Written -or ($record.Asked -and $preferences -notcontains $key)) { $keys[$key].Touched = $true }
    }
  }

  # config.ghostty: its state before the earliest record in the window that wrote it.
  $record = $null
  foreach ($item in $window) {
    foreach ($file in $item.Manifest['files']) {
      if ($null -ne $record -or $file['role'].ToString() -ne 'ghostty') { continue }
      $source = if ($null -ne $file['backupFile']) { Join-J3w1Path $item.Path $file['backupFile'].ToString() } else { $null }
      $record = @{ Path = $file['path'].ToString(); Existed = $file['existedBefore'].GetValue[bool](); Source = $source }
    }
  }
  $ghosttyPath = if ($null -ne $record) { $record.Path } else { $paths.Ghostty }
  $target = $null
  if ($null -ne $record) {
    if ($record.Existed) {
      if ($null -eq $record.Source -or -not (Test-Path -LiteralPath $record.Source -PathType Leaf)) { throw "The backup copy of $ghosttyPath is missing ($($record.Source))." }
      $target = ConvertTo-J3w1GhosttyState -Path $ghosttyPath -Bytes ([System.IO.File]::ReadAllBytes($record.Source))
    } else {
      $target = ConvertTo-J3w1GhosttyState -Path $ghosttyPath -Bytes $null
    }
  }
  $ghostty = Read-J3w1Ghostty $ghosttyPath
  Assert-J3w1SingleBlock $ghostty
  if ($null -eq $record -and $mode -ne 'default') {
    # -Latest and -Backup return to the state before records that never
    # wrote the file: it stays as it is.
    $filePlan = @{ Action = 'none' }
  } else {
    $filePlan = Get-J3w1GhosttyRestorePlan -Current $ghostty -Target $target -KeepTargetBlock:($mode -ne 'default')
  }

  # What the kit last wrote or asked for, to tell the owner about later edits.
  $lastWritten = @{}
  $lastAfter = @{}
  foreach ($item in $backups) {
    foreach ($file in $item.Manifest['files']) {
      $after = $file['sha256After']
      $lastWritten[$file['role'].ToString()] = @{ Digest = $(if ($null -eq $after) { $null } else { $after.ToString() }); Name = $item.Name }
    }
    if (-not (Test-J3w1RunManifest $item.Manifest) -and -not (Get-J3w1ManifestBool $item.Manifest 'complete' $true)) { continue }
    foreach ($key in $item.Info.Keys) {
      if ($null -ne $item.Info[$key].After) { $lastAfter[$key] = @{ Node = $item.Info[$key].After; Name = $item.Name } }
    }
  }
  # A key that differs, at a later record in the window, from what the kit
  # had left or asked for: the owner (or Orca) changed it between runs. A
  # record that only asked Orca (store not written) left the value it found,
  # so a later value equal to that one is no change either.
  $between = @{}
  $left = @{}
  foreach ($item in $window) {
    $finished = (Test-J3w1RunManifest $item.Manifest) -or (Get-J3w1ManifestBool $item.Manifest 'complete' $true)
    foreach ($key in $item.Info.Keys) {
      $entry = $item.Info[$key]
      $unchanged = $left.Contains($key) -and ((Test-J3w1SameValue $left[$key].Node $entry.Before) -or ($null -ne $left[$key].Found -and (Test-J3w1SameValue $left[$key].Found $entry.Before)))
      if ($left.Contains($key) -and -not $between.Contains($key) -and -not $unchanged) {
        $between[$key] = "$key was $(Format-J3w1Node $entry.Before) at backup $($item.Name), not $(Format-J3w1Node $left[$key].Node) as the kit left or asked for at backup $($left[$key].Name)"
      }
      if ($finished -and $null -ne $entry.After) {
        $left[$key] = @{ Node = $entry.After; Found = $null; Name = $item.Name }
        if ($entry.Asked) { $left[$key].Found = $entry.Before }
      }
    }
  }

  $storeBytes = [System.IO.File]::ReadAllBytes($paths.Settings)
  $store = Read-J3w1JsonNode $paths.Settings
  $changes = [System.Collections.Generic.List[object]]::new()
  $unknown = [System.Collections.Generic.List[object]]::new()
  $kept = [System.Collections.Generic.List[object]]::new()
  foreach ($key in $keys.Keys) {
    $info = $keys[$key]
    $before = Get-J3w1NodeAt $store $key
    # Assigned in the branches: an if-expression would unroll a JsonObject.
    $currentNode = Get-J3w1AbsentNode
    if ($before.Present) { $currentNode = $before.Node }
    if ($clean -and $info.EqualsKit -and ($info.BlockBefore -or $carried -contains $key)) { $unknown.Add(@{ Key = $key; Current = $before; From = $info.From }); continue }
    if (-not $info.Touched) { continue }
    $value = $info.Value
    $after = if (Test-J3w1AbsentNode $value) { @{ Present = $false; Node = $null } } else { @{ Present = $true; Node = $value } }
    $same = if ($after.Present) { $before.Present -and (Test-J3w1NodeEqual $before.Node $after.Node) } else { -not $before.Present }
    if ($same) { continue }
    if ($preferences -contains $key -and $lastAfter.Contains($key) -and -not (Test-J3w1SameValue $lastAfter[$key].Node $currentNode)) {
      $kept.Add(@{ Key = $key; Current = $before })
      continue
    }
    $changes.Add(@{ Key = $key; Before = $before; After = $after; CurrentNode = $currentNode })
  }

  Write-Host ''
  Write-Host 'Plan:'
  if ($filePlan.Action -ne 'none') { Write-Host "  $($ghosttyPath): $($filePlan.Note)" }
  foreach ($change in $changes) { Write-Host ("  {0,-30} {1} -> {2}" -f $change.Key, (Format-J3w1Value $change.Before), (Format-J3w1Value $change.After)) }
  foreach ($item in $kept) { Write-Host ("  {0,-30} kept at {1}: changed after the kit set it (the size is yours)" -f $item.Key, (Format-J3w1Value $item.Current)) }
  foreach ($item in $unknown) { Write-Host ("  {0,-30} left as {1}: cannot know the pre-kit value" -f $item.Key, (Format-J3w1Value $item.Current)) }
  foreach ($change in $changes) {
    if ($between.Contains($change.Key)) {
      Write-Warning "$($between[$change.Key]). Restore returns the earlier value, $(Format-J3w1Value $change.After)."
    }
    $last = $lastAfter[$change.Key]
    if ($null -ne $last -and -not (Test-J3w1SameValue $last.Node $change.CurrentNode)) {
      Write-Warning "$($change.Key) is $(Format-J3w1Value $change.Before) now, not $(Format-J3w1Node $last.Node) as the kit last left or asked for (backup $($last.Name)); it changed since. Restore sets it to $(Format-J3w1Value $change.After)."
    }
  }
  if ($ghostty.Exists -and $lastWritten.Contains('ghostty') -and $lastWritten['ghostty'].Digest -ne (Get-J3w1Digest $ghostty.Bytes)) {
    Write-Warning "$ghosttyPath changed since the kit last wrote it (backup $($lastWritten['ghostty'].Name)). Only the managed block is taken out; every other line stays."
  }
  if ($lastWritten.Contains('store') -and $lastWritten['store'].Digest -ne (Get-J3w1Digest $storeBytes)) {
    Write-Warning "$($paths.Settings) changed since the kit last wrote it (backup $($lastWritten['store'].Name)); Orca rewrites it on every change, so this is expected. Only the managed keys are restored; every other value stays."
  }
  if ($unknown.Count -gt 0) {
    Write-Host ''
    Write-Host "Cannot know the pre-kit value of $(($unknown | ForEach-Object { $_.Key }) -join ', '): the earliest kit record"
    Write-Host "($($unknown[0].From)) already found the kit's value while config.ghostty held the managed block (or an earlier"
    Write-Host "restore could not know it either), which is what Orca's Import from Ghostty writes. These keys are left"
    Write-Host 'as they are; set them in Orca if you want other values.'
  }
  $storeRefused = $changes.Count -gt 0 -and $running
  if ($storeRefused) {
    Write-Host ''
    Write-Host 'Orca is running: the store part is refused. Orca holds its settings in memory and would overwrite'
    Write-Host 'the file; quit Orca (tray too) and rerun to restore those keys. Ghostty files are restored now.'
  }
  $doStore = $changes.Count -gt 0 -and -not $running
  $doFile = @('write', 'delete') -contains $filePlan.Action
  # A boundary leaves no kit value applied: the next default restore starts after it.
  $boundary = $clean -and -not $storeRefused
  $code = if ($storeRefused) { 2 } elseif ($unknown.Count -gt 0) { 3 } else { 0 }
  $idle = {
    if ($unknown.Count -gt 0) { Write-Host "Result: nothing restored; $($unknown.Count) key(s) left as they are because their pre-kit value is unknown." }
    elseif ($storeRefused) { Write-Host 'Result: nothing written; quit Orca (tray too) and rerun.' }
    else { Write-Host 'Result: nothing to restore.' }
  }
  if ($PlanOnly) {
    Write-Host ''
    if ($doStore -or $doFile) { Write-Host 'Result: -WhatIf, nothing written.' } else { & $idle }
    return $code
  }
  if (-not $doStore -and -not $doFile -and -not $boundary) {
    Write-Host ''
    & $idle
    return $code
  }

  # Plan and serialise everything first: a failure here leaves no backup
  # folder, no manifest and no changed file.
  $records = [System.Collections.Generic.List[object]]::new()
  $storeText = $null
  if ($doStore) {
    foreach ($change in $changes) {
      if ($change.After.Present) { Set-J3w1NodeAt $store $change.Key $change.After.Node } else { Remove-J3w1NodeAt $store $change.Key }
    }
    $storeText = ConvertTo-J3w1JsonText $store
    $records.Add(@{ Path = $paths.Settings; Role = 'store'; BackupFile = $null; ExistedBefore = $true; Sha256Before = (Get-J3w1Digest $storeBytes); Sha256After = (Get-J3w1Digest $script:Utf8.GetBytes($storeText)) })
  }
  if ($doFile) {
    $afterDigest = if ($filePlan.Action -eq 'delete') { $null } else { Get-J3w1Digest $filePlan.Bytes }
    $records.Add(@{ Path = $ghosttyPath; Role = 'ghostty'; BackupFile = 'config.ghostty'; ExistedBefore = $true; Sha256Before = (Get-J3w1Digest $ghostty.Bytes); Sha256After = $afterDigest })
  }
  $recordedKeys = [System.Collections.Generic.List[string]]::new()
  foreach ($key in @($managed) + @($keys.Keys)) { if (-not $recordedKeys.Contains($key)) { $recordedKeys.Add($key) } }
  $manifest = [System.Text.Json.Nodes.JsonObject]::new()
  $manifest['schemaVersion'] = New-J3w1JsonNode 1
  $manifest['kit'] = New-J3w1JsonNode $script:InstallerId
  $manifest['operation'] = New-J3w1JsonNode 'restore'
  $manifest['timestamp'] = New-J3w1JsonNode (Get-J3w1Timestamp)
  $manifest['mode'] = New-J3w1JsonNode $mode
  $manifest['restoredTo'] = New-J3w1JsonNode $label
  $manifest['complete'] = New-J3w1JsonNode $false
  $manifest['boundary'] = New-J3w1JsonNode $boundary
  $manifest['storeWritten'] = New-J3w1JsonNode $doStore
  $manifest['refused'] = New-J3w1JsonNode $storeRefused
  $manifest['unknown'] = New-J3w1JsonNode @($unknown | ForEach-Object { $_.Key })
  $manifest['managedKeys'] = New-J3w1JsonNode @($recordedKeys)
  $manifest['files'] = New-J3w1JsonNode @($records | ForEach-Object {
    [ordered]@{ path = $_.Path; role = $_.Role; backupFile = $_.BackupFile; existedBefore = $_.ExistedBefore; sha256Before = $_.Sha256Before; sha256After = $_.Sha256After }
  })
  $manifest['settings'] = [System.Text.Json.Nodes.JsonArray]::new()
  if ($doStore) {
    foreach ($change in $changes) {
      $entry = [System.Text.Json.Nodes.JsonObject]::new()
      $entry['key'] = New-J3w1JsonNode $change.Key
      $entry['before'] = if ($change.Before.Present) { New-J3w1JsonNode $change.Before.Node } else { Get-J3w1AbsentNode }
      $entry['after'] = if ($change.After.Present) { New-J3w1JsonNode $change.After.Node } else { Get-J3w1AbsentNode }
      $manifest['settings'].Add($entry)
    }
  }
  $manifestText = ConvertTo-J3w1JsonText $manifest
  if ($doStore -and (Test-J3w1OrcaRunning $Environment)) { throw 'Orca started during the restore; nothing was written. Quit Orca (tray too) and rerun.' }

  # Back up the current state, record the restore as not yet complete, write,
  # then mark it complete.
  $snapshot = New-J3w1BackupFolder $Environment
  $manifestPath = Join-J3w1Path $snapshot.Path 'manifest.json'
  if ($doFile) { [System.IO.File]::WriteAllBytes((Join-J3w1Path $snapshot.Path 'config.ghostty'), $ghostty.Bytes) }
  Write-J3w1Text $manifestPath $manifestText
  try {
    if ($filePlan.Action -eq 'delete') { Remove-Item -LiteralPath $ghosttyPath -Force }
    elseif ($doFile) { Write-J3w1Bytes -Path $ghosttyPath -Bytes $filePlan.Bytes }
    if ($doStore) {
      if (Test-J3w1OrcaRunning $Environment) { throw 'Orca started during the restore; the store was not written.' }
      Write-J3w1Text $paths.Settings $storeText
    }
    if (-not $storeRefused) {
      # The kit is no longer the last thing applied; Test reports that.
      $current = Join-J3w1Path $Environment.StateRoot 'current'
      foreach ($name in 'manifest.json', 'config.ghostty.block', 'theme.lock.orca.json') {
        Remove-Item -LiteralPath (Join-J3w1Path $current $name) -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {
    $again = switch ($mode) { 'latest' { 'Restore -Latest' } 'backup' { "Restore -Backup $Backup" } default { 'Restore' } }
    throw "$($_.Exception.Message) The restore stopped partway and is not recorded as done: quit Orca (tray too) and run $again again; it finishes the job. The state before this run is in $($snapshot.Path)."
  }
  $manifest['complete'] = New-J3w1JsonNode $true
  Write-J3w1Text $manifestPath (ConvertTo-J3w1JsonText $manifest)

  Write-Host ''
  if (-not $doStore -and -not $doFile) {
    & $idle
    Write-Host "Recorded as the last restore (backup $($snapshot.Name)): the next restore starts after it."
  } elseif ($unknown.Count -gt 0) {
    Write-Host "Result: done, except $($unknown.Count) key(s) left as they are because their pre-kit value is unknown: $(($unknown | ForEach-Object { $_.Key }) -join ', ')."
    Write-Host "The state before this run is in $($snapshot.Path)"
  } elseif ($storeRefused) {
    Write-Host "Result: config.ghostty done; the store part waits until Orca is closed. The state before this run is in $($snapshot.Path)"
  } else {
    Write-Host "Result: restored. The state before the restore is in $($snapshot.Path)"
  }
  return $code
}

Export-ModuleMember -Function *-J3w1*
