# J3w1Kit.psm1 - shared functions of the j3w1 terminal kit for the Orca
# desktop client on Windows. The scripts next to this module are thin entry
# points; every rule lives here so Apply, Update, Test and Restore share one
# code path.
#
# Values come only from the pinned export (exports/tokens.resolved.json at the
# revision kit.json names, verified against kit.json's exports.tokensDigest
# and exports/digests.json). This file
# holds no colour values. orca-data.json is edited losslessly with
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
  <# Resolves the folders the kit reads and writes. The test seam
     (J3W1_KIT_TEST_ROOT) maps APPDATA and LOCALAPPDATA under one fake root,
     reads Orca's running state and the installed fonts from variables, and
     disables the network. Inside the seam only, J3W1_KIT_TEST_SOURCE=worktree
     lets -SourceRoot be a plain folder; such a run never counts the pin as
     verified. The seam is never active otherwise. #>
  $testRoot = $env:J3W1_KIT_TEST_ROOT
  $seam = -not [string]::IsNullOrWhiteSpace($testRoot)
  if ($seam) {
    $appData = Join-J3w1Path $testRoot 'AppData/Roaming'
    $localAppData = Join-J3w1Path $testRoot 'AppData/Local'
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
# Kit files, pin and export
# ---------------------------------------------------------------------------

function Read-J3w1KitBytes {
  <# One kit file (a path relative to tools/terminal-kit). $Source is
     @{ Root } for a kit folder on disk, or @{ Environment; Kit; Pin;
     SourceRoot; NoCache } for the kit published at a theme revision. #>
  param([hashtable]$Source, [string]$Path)
  if ($Source.Contains('Root')) {
    $file = Join-J3w1Path $Source.Root $Path
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { return $null }
    return , [System.IO.File]::ReadAllBytes($file)
  }
  return , (Get-J3w1SourceBytes -Environment $Source.Environment -Kit $Source.Kit -Pin $Source.Pin -Path "tools/terminal-kit/$Path" -SourceRoot $Source.SourceRoot -AllowNotFound -NoCache:$Source.NoCache)
}

function Read-J3w1KitFiles {
  <# Loads kit.json and the maps it names: from a kit folder (the parent of
     windows/), or through a revision source (see Read-J3w1KitBytes).
     Returns $null when a revision source has no kit.json. #>
  param([string]$KitRoot, [hashtable]$Source)
  if ($null -eq $Source) { $Source = @{ Root = $KitRoot } }
  $label = if ($Source.Contains('Root')) { $Source.Root } else { "tools/terminal-kit at $($Source.Pin.Revision)" }
  $load = {
    param($path, [switch]$Optional)
    $bytes = Read-J3w1KitBytes $Source $path
    if ($null -eq $bytes) {
      if ($Optional) { return $null }
      throw "Missing kit file $path in $label"
    }
    ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $bytes) -AsHashtable
  }
  $kit = & $load 'kit.json' -Optional:(-not $Source.Contains('Root'))
  if ($null -eq $kit) { return $null }
  if ($kit.schemaVersion -ne 1) { throw "Unsupported kit.json schemaVersion $($kit.schemaVersion) in $label" }
  return @{
    Label = $label
    Kit = $kit
    Roles = & $load $kit.integrations.orca.roles
    ClaudeRoles = & $load $kit.integrations['claude-code'].roles
    Specimen = & $load $kit.specimen
  }
}

function Get-J3w1Pin {
  <# The theme pin: kit.json's, or the one a manifest recorded. #>
  param($Kit, $Theme)
  if ($null -eq $Theme) { $Theme = $Kit.theme }
  $pin = @{
    Name = $Kit.theme.name
    Repository = $Kit.theme.repository
    Version = [string]$Theme.version
    Ref = [string]$Theme.ref
    Revision = [string]$Theme.revision
    Profile = [string]$Theme.profile
  }
  if ($pin.Revision -notmatch '^[0-9a-f]{40}$') { throw "The pinned revision is not a full commit: $($pin.Revision)" }
  return $pin
}

function Get-J3w1PinnedDigest {
  <# The sha256 of tokens.resolved.json that a kit.json pins for this
     revision (exports.tokensDigest next to theme.revision), from the first of
     $Kits that pins exactly this revision; $null when none does. #>
  param($Pin, [object[]]$Kits)
  foreach ($kit in $Kits) {
    if ($null -eq $kit -or $null -eq $kit.theme -or $null -eq $kit.exports) { continue }
    if ([string]$kit.theme.revision -ne $Pin.Revision) { continue }
    $digest = [string]$kit.exports['tokensDigest']
    if ($digest -match '^sha256-[A-Za-z0-9+/=]+$') { return @{ Digest = $digest; Source = "kit.json exports.tokensDigest" } }
  }
  return $null
}

function Expand-J3w1Url {
  param([string]$Template, [hashtable]$Values)
  $url = $Template
  foreach ($name in $Values.Keys) { $url = $url.Replace('{' + $name + '}', [string]$Values[$name]) }
  return $url
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
    $client.DefaultRequestHeaders.UserAgent.ParseAdd('j3w1-terminal-kit')
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
  try { $process = [System.Diagnostics.Process]::Start($info) } catch { throw 'git is required for -SourceRoot; it was not found on PATH.' }
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

function Assert-J3w1GitSource {
  <# -SourceRoot must be a git checkout that holds the pinned commit; files
     are then read from git objects at that commit, never from the working
     tree. A local tag of the pinned name must resolve to the same commit.
     Returns how the pin was checked. #>
  param([string]$SourceRoot, $Pin)
  if ($null -eq (Invoke-J3w1Git -Arguments @('-C', $SourceRoot, 'rev-parse', '--git-dir') -AllowFailure)) {
    throw "-SourceRoot $SourceRoot is not a git checkout. The kit reads git objects at the pinned commit $($Pin.Revision), never a folder's files; pass a clone of $($Pin.Repository)."
  }
  if ($null -eq (Invoke-J3w1Git -Arguments @('-C', $SourceRoot, 'cat-file', '-e', "$($Pin.Revision)^{commit}") -AllowFailure)) {
    throw "-SourceRoot $SourceRoot does not contain the pinned commit $($Pin.Revision) ($($Pin.Ref)). Fetch it (git -C `"$SourceRoot`" fetch --tags origin) and rerun."
  }
  $tag = Invoke-J3w1Git -Arguments @('-C', $SourceRoot, 'rev-parse', '--verify', '--quiet', "refs/tags/$($Pin.Ref)^{commit}") -AllowFailure
  if ($null -eq $tag) { return "commit $($Pin.Revision) read from git; tag $($Pin.Ref) is not in this checkout" }
  $resolved = (ConvertFrom-J3w1Bytes $tag).Trim()
  if ($resolved -ne $Pin.Revision) { throw "Tag $($Pin.Ref) resolves to $resolved in $SourceRoot, not the pinned $($Pin.Revision). Refusing." }
  return "tag $($Pin.Ref) resolves to the pinned commit in git"
}

function Resolve-J3w1TagRevision {
  <# Resolves a release tag to its commit: through the GitHub API, or through
     git in a local checkout. A lightweight tag's object.sha is the commit
     (v1.2.0 is one); an annotated tag is followed to the commit it names. #>
  param($Environment, $Kit, [string]$Ref, [string]$SourceRoot)
  if ($Ref -notmatch '^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$') { throw "Not a release tag: '$Ref'. Pass an exact tag such as v1.2.0; branches and 'latest' are refused." }
  if (-not [string]::IsNullOrWhiteSpace($SourceRoot)) {
    $bytes = Invoke-J3w1Git -Arguments @('-C', $SourceRoot, 'rev-parse', '--verify', '--quiet', "refs/tags/$Ref^{commit}") -AllowFailure
    if ($null -eq $bytes) { throw "Tag $Ref does not exist in $SourceRoot." }
    return (ConvertFrom-J3w1Bytes $bytes).Trim()
  }
  $url = Expand-J3w1Url $Kit.urls.tagRef @{ repository = $Kit.theme.repository; ref = $Ref }
  $body = Invoke-J3w1Http -Environment $Environment -Url $url -AllowNotFound
  if ($null -eq $body) { throw "Tag $Ref does not exist in $($Kit.theme.repository)." }
  $data = ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $body) -AsHashtable
  if ($data -isnot [System.Collections.IDictionary]) { throw "Tag $Ref is ambiguous in $($Kit.theme.repository)." }
  if ($data.object.type -eq 'tag') {
    # An annotated tag (older releases): its tag object names the commit.
    $body = Invoke-J3w1Http -Environment $Environment -Url ([string]$data.object.url)
    $data = ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $body) -AsHashtable
  }
  if ($data.object.type -ne 'commit') { throw "Tag $Ref points to a $($data.object.type), not a commit. Refusing." }
  return [string]$data.object.sha
}

function Get-J3w1SourceBytes {
  <# One repository file at the pinned revision: from -SourceRoot (git
     objects at the revision; a plain folder only inside the test seam),
     from the cache, or from raw.githubusercontent.com at the revision SHA
     (never a branch). #>
  param($Environment, $Kit, $Pin, [string]$Path, [string]$SourceRoot, [switch]$AllowNotFound, [switch]$NoCache)
  if (-not [string]::IsNullOrWhiteSpace($SourceRoot)) {
    if (-not $Environment.SourceWorktree) {
      $bytes = Invoke-J3w1Git -Arguments @('-C', $SourceRoot, 'cat-file', 'blob', "$($Pin.Revision):$Path") -AllowFailure
      if ($null -eq $bytes -and -not $AllowNotFound) { throw "$Path does not exist at $($Pin.Revision) in $SourceRoot." }
      return , $bytes
    }
    $local = Join-J3w1Path $SourceRoot $Path
    if (-not (Test-Path -LiteralPath $local -PathType Leaf)) {
      if ($AllowNotFound) { return $null }
      throw "Missing $Path under -SourceRoot $SourceRoot."
    }
    return , [System.IO.File]::ReadAllBytes($local)
  }
  $cached = Join-J3w1Path $Environment.StateRoot "cache/$($Pin.Revision)/$Path"
  if (Test-Path -LiteralPath $cached -PathType Leaf) { return , [System.IO.File]::ReadAllBytes($cached) }
  $url = Expand-J3w1Url $Kit.urls.raw @{ repository = $Pin.Repository; revision = $Pin.Revision; path = $Path }
  $bytes = Invoke-J3w1Http -Environment $Environment -Url $url -AllowNotFound:$AllowNotFound
  if ($null -ne $bytes -and -not $NoCache) { Write-J3w1Bytes -Path $cached -Bytes $bytes }
  return , $bytes
}

function Get-J3w1Export {
  <# Reads and verifies the pinned export. Where it comes from:
       -SourceRoot  git objects at the pinned commit; the checkout must hold
                    it, and a local tag of that name must resolve to it.
       cache        a copy fetched on an earlier run, re-verified every time.
       network      the tag must resolve to the pinned commit (GitHub API),
                    then raw files at that commit SHA.
     On every path tokens.resolved.json must equal the digest kit.json pins
     for the revision ($PinnedDigest) and its entry in digests.json. The copy
     is cached only after it passed. #>
  param($Environment, $Kit, $Pin, [string]$SourceRoot, [switch]$NoCache, [switch]$SkipPinCheck, $PinnedDigest)
  $tokensPath = $Kit.exports.tokens
  $digestsPath = $Kit.exports.digests
  $cacheRoot = Join-J3w1Path $Environment.StateRoot "cache/$($Pin.Revision)"
  $cachedTokens = Join-J3w1Path $cacheRoot $tokensPath
  $cachedDigests = Join-J3w1Path $cacheRoot $digestsPath
  $pinVerified = $true
  $fromCache = $false
  $kind = 'network'
  if (-not [string]::IsNullOrWhiteSpace($SourceRoot)) {
    if ($Environment.SourceWorktree) {
      $kind = 'worktree'
      $pinVerified = $false
      $pinCheck = 'working tree (test seam): the pin is NOT verified'
    } else {
      $kind = 'git'
      $pinCheck = Assert-J3w1GitSource -SourceRoot $SourceRoot -Pin $Pin
    }
  } elseif ((Test-Path -LiteralPath $cachedTokens -PathType Leaf) -and (Test-Path -LiteralPath $cachedDigests -PathType Leaf)) {
    $kind = 'cache'
    $fromCache = $true
    $pinCheck = "cache of $($Pin.Revision)"
  } elseif ($SkipPinCheck) {
    $pinCheck = 'tag resolved by the caller'
  } else {
    $resolved = Resolve-J3w1TagRevision -Environment $Environment -Kit $Kit -Ref $Pin.Ref
    if ($resolved -ne $Pin.Revision) { throw "Tag $($Pin.Ref) resolves to $resolved, not the pinned $($Pin.Revision). Refusing." }
    $pinCheck = "tag $($Pin.Ref) resolves to the pinned revision"
  }
  if ($fromCache) {
    $digestsBytes = [System.IO.File]::ReadAllBytes($cachedDigests)
    $tokensBytes = [System.IO.File]::ReadAllBytes($cachedTokens)
  } else {
    $digestsBytes = Get-J3w1SourceBytes -Environment $Environment -Kit $Kit -Pin $Pin -Path $digestsPath -SourceRoot $SourceRoot -NoCache
    $tokensBytes = Get-J3w1SourceBytes -Environment $Environment -Kit $Kit -Pin $Pin -Path $tokensPath -SourceRoot $SourceRoot -NoCache
  }
  $refuse = {
    param([string]$Message)
    if ($fromCache) {
      foreach ($file in $cachedTokens, $cachedDigests) { Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue }
      $Message += ' The cached copy was removed.'
    }
    throw $Message
  }
  $actual = Get-J3w1Digest $tokensBytes
  if ($null -ne $PinnedDigest) {
    if ($actual -ne $PinnedDigest.Digest) { & $refuse "Digest mismatch for ${tokensPath}: $($PinnedDigest.Source) pins $($PinnedDigest.Digest), got $actual. Refusing to use it." }
    $pinCheck += '; pinned digest verified'
  } else {
    $pinCheck += '; no kit.json pins a digest for this revision, digests.json only'
  }
  $digests = ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $digestsBytes) -AsHashtable
  $expected = $digests.files[$tokensPath]
  if ([string]::IsNullOrWhiteSpace($expected)) { & $refuse "$digestsPath lists no digest for $tokensPath. Refusing." }
  if ($actual -ne $expected) { & $refuse "Digest mismatch for ${tokensPath}: expected $expected from $digestsPath, got $actual. Refusing to use it." }
  $tokens = ConvertFrom-Json -InputObject (ConvertFrom-J3w1Bytes $tokensBytes) -AsHashtable
  if ([string]$tokens.version -ne $Pin.Version) { throw "The export is version $($tokens.version), the pin says $($Pin.Version). Refusing." }
  $profile = $tokens.profiles[$Pin.Profile]
  if ($null -eq $profile) { throw "Profile '$($Pin.Profile)' is not in the export." }
  if ($profile.status -ne 'approved') { throw "Profile '$($Pin.Profile)' is $($profile.status); only an approved profile is delivered." }
  if ($kind -eq 'network' -and -not $NoCache) {
    Write-J3w1Bytes -Path $cachedDigests -Bytes $digestsBytes
    Write-J3w1Bytes -Path $cachedTokens -Bytes $tokensBytes
  }
  return @{
    Pin = $Pin
    Tokens = $profile.tokens
    Eligibility = $Kit.eligibility
    Digests = [ordered]@{ $tokensPath = $actual; $digestsPath = (Get-J3w1Digest $digestsBytes) }
    PinCheck = $pinCheck
    PinVerified = $pinVerified
    SourceKind = $kind
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
  <# Every value the kit sets, in the order roles/terminal.json lists them.
     terminalFontSize follows the machine: the current store value when there
     is one, the token otherwise. #>
  param($KitFiles, $Export, $CurrentFontSize)
  $roles = $KitFiles.Roles
  $disclosures = [System.Collections.Generic.List[object]]::new()
  $tokenFontSize = $null
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
      if ($rule.Contains('preference')) {
        $tokenFontSize = $value
        if ($null -eq $fontSize) { $fontSize = $value }
        $value = $fontSize
      }
      $settings[$name] = $value
    }
  }
  $lines = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $roles.ghostty.lines) {
    $pick = if ($line.Contains('pick')) { $line.pick } else { '' }
    $value = Resolve-J3w1Token $Export $line.token $pick $disclosures
    if ($line.Contains('preference')) { $value = $fontSize }
    $text = if ($value -is [string]) { $value } else { Format-J3w1Number $value }
    if ($line.Contains('index')) { $text = "$($line.index)=$text" }
    $lines.Add("$($line.key) = $text")
  }
  return @{
    Settings = $settings
    GhosttyLines = $lines
    FontSize = $fontSize
    TokenFontSize = $tokenFontSize
    Disclosures = $disclosures
  }
}

function Get-J3w1GhosttyBlock {
  param($Pin, $Expected, [string]$NewLine = "`n")
  $lines = @($script:BlockStart,
    "# $($Pin.Name) $($Pin.Version) ($($Pin.Ref) @ $($Pin.Revision)), $($Pin.Profile) profile, for Orca's Import from Ghostty.") + $Expected.GhosttyLines + @($script:BlockEnd)
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
  $state = @{ Path = $Path; Exists = $false; Bom = $false; Text = ''; NewLine = "`n"; Match = $null; Bytes = $null }
  if ($null -ne $Bytes) {
    $state.Exists = $true
    $state.Bytes = $Bytes
    $state.Bom = $Bytes.Length -ge 3 -and $Bytes[0] -eq 0xEF -and $Bytes[1] -eq 0xBB -and $Bytes[2] -eq 0xBF
    $state.Text = ConvertFrom-J3w1Bytes $Bytes
    if ($state.Text.Contains("`r`n")) { $state.NewLine = "`r`n" }
    $match = [regex]::Match($state.Text, (Get-J3w1BlockPattern))
    if ($match.Success) { $state.Match = $match }
  }
  return $state
}

function Read-J3w1Ghostty {
  <# config.ghostty as text, with the managed block located. #>
  param([string]$Path)
  $bytes = if (Test-Path -LiteralPath $Path -PathType Leaf) { [System.IO.File]::ReadAllBytes($Path) } else { $null }
  return ConvertTo-J3w1GhosttyState -Path $Path -Bytes $bytes
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
  <# Everything a run needs: folders, kit maps, the verified export. The
     digest the export must match comes from the first kit.json (the run's
     own maps, then -Kits) that pins exactly this revision, else from
     -PinnedDigest. #>
  param([string]$KitRoot, [string]$SourceRoot, $Pin, $KitFiles, [object[]]$Kits, $PinnedDigest, [switch]$NoCache, [switch]$SkipPinCheck)
  $environment = Get-J3w1Environment
  if ($null -eq $KitFiles) { $KitFiles = Read-J3w1KitFiles $KitRoot }
  if ($null -eq $Pin) { $Pin = Get-J3w1Pin $KitFiles.Kit }
  if (-not [string]::IsNullOrWhiteSpace($SourceRoot)) {
    $SourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
  }
  $pinned = Get-J3w1PinnedDigest -Pin $Pin -Kits (@($KitFiles.Kit) + @($Kits))
  if ($null -eq $pinned) { $pinned = $PinnedDigest }
  $export = Get-J3w1Export -Environment $environment -Kit $KitFiles.Kit -Pin $Pin -SourceRoot $SourceRoot -NoCache:$NoCache -SkipPinCheck:$SkipPinCheck -PinnedDigest $pinned
  return @{ Environment = $environment; KitFiles = $KitFiles; Pin = $Pin; Export = $export; SourceRoot = $SourceRoot }
}

function Get-J3w1CurrentManifest {
  param($Environment)
  $path = Join-J3w1Path $Environment.StateRoot 'current/manifest.json'
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { return $null }
  return , (Read-J3w1JsonNode $path)
}

function Get-J3w1ManagedKeys {
  param($KitFiles)
  return , (@('terminalColorOverrides') + @($KitFiles.Roles.orca.settings.Keys))
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
     store was written; equalsKit marks a value that already was the kit's
     (a preference such as the font size never is: the kit keeps it). #>
  param($Context, [string]$Operation, [string]$Timestamp, [string]$OrcaVersion, $ClaudeVersion, $Files, $Settings, $Observed, $Preserved, $Disclosures, [bool]$StoreWritten, [bool]$GhosttyBlockBefore, $FontSize)
  $pin = $Context.Pin
  $manifest = [System.Text.Json.Nodes.JsonObject]::new()
  $manifest['schemaVersion'] = New-J3w1JsonNode 1
  $manifest['kit'] = New-J3w1JsonNode $Context.KitFiles.Kit.id
  $manifest['operation'] = New-J3w1JsonNode $Operation
  $manifest['timestamp'] = New-J3w1JsonNode $Timestamp
  $manifest['orcaVersion'] = New-J3w1JsonNode $OrcaVersion
  $manifest['claudeCodeVersion'] = if ($null -eq $ClaudeVersion) { $null } else { New-J3w1JsonNode $ClaudeVersion }
  $manifest['theme'] = New-J3w1JsonNode ([ordered]@{ name = $pin.Name; version = $pin.Version; ref = $pin.Ref; revision = $pin.Revision; profile = $pin.Profile })
  $manifest['source'] = New-J3w1JsonNode ([ordered]@{ kind = $Context.Export.SourceKind; pinVerified = [bool]$Context.Export.PinVerified })
  $manifest['storeWritten'] = New-J3w1JsonNode $StoreWritten
  $manifest['ghosttyBlockBefore'] = New-J3w1JsonNode $GhosttyBlockBefore
  $manifest['preferences'] = New-J3w1JsonNode ([ordered]@{ terminalFontSize = $FontSize })
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
  Write-Host "j3w1 terminal kit: $Title"
  Write-Host "  theme        $($pin.Name) $($pin.Version) ($($pin.Ref) @ $($pin.Revision)), profile $($pin.Profile)"
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
    $isPreference = $roles.orca.settings.Contains($change.Key) -and $roles.orca.settings[$change.Key].Contains('preference')
    @{ Key = $change.Key; Slot = $change.Before; EqualsKit = (-not $isPreference) -and $change.Before.Present -and (Test-J3w1SameValue $change.Before.Node $change.After.Node) }
  }
  $pending = @($changes | Where-Object { $_.Differs })
  $running = Test-J3w1OrcaRunning $environment
  $writeStore = $pending.Count -gt 0 -and -not $running

  # Ghostty: the managed block in config.ghostty.
  $ghostty = Read-J3w1Ghostty $paths.Ghostty
  $ghosttyBytes = Get-J3w1GhosttyUpdate -State $ghostty -Pin $Context.Pin -Expected $expected
  $writeGhostty = -not $ghostty.Exists -or -not [System.Linq.Enumerable]::SequenceEqual([byte[]]$ghostty.Bytes, [byte[]]$ghosttyBytes)

  # Preserved keys and the owner's expected preferences: reported, never changed.
  $preserved = [System.Collections.Generic.List[object]]::new()
  foreach ($key in $roles.orca.preserve) { $preserved.Add(@{ Key = $key; Slot = (Get-J3w1NodeAt $store $key) }) }

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
  $preKit = Get-J3w1PreKitStorePath $environment
  $savePreKit = $writeStore -and -not (Test-Path -LiteralPath $preKit -PathType Leaf)
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
  if ($savePreKit) { Write-Host "Full pre-kit copy of Orca's store (it holds the whole private store; kept once, never overwritten): $preKit" }
  if ($null -eq $lockText) { Write-Host 'The pin was not verified (working tree source), so no theme.lock.orca.json was written.' }
  if ($result.StorePending) { Write-J3w1GuiSteps }
  if ($ghostty.Exists -eq $false -or $writeGhostty) { Write-Host "Ghostty block: $($paths.Ghostty)" }
  return $result
}

function Invoke-J3w1OrcaUpdate {
  <# Moves to another release: the tag resolves to its commit (API, or git in
     -SourceRoot), the kit maps come from that commit when it publishes them
     (else this kit's maps are used, and said so), the export is verified,
     and the same apply path runs with a full before/after diff, then the
     checks. Never follows a branch. Returns the process exit code. #>
  param([string]$KitRoot, [string]$Version, [string]$SourceRoot, [switch]$PlanOnly, [switch]$SkipFontCheck)
  if ($Version -notmatch '^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$') {
    throw "-Version must be an exact release tag such as v1.2.0; '$Version' is refused (branches, 'main' and 'latest' are never followed)."
  }
  $environment = Get-J3w1Environment
  $fromGit = -not [string]::IsNullOrWhiteSpace($SourceRoot)
  if ($fromGit -and $environment.SourceWorktree) { throw 'Update reads git objects at the tag only; unset J3W1_KIT_TEST_SOURCE.' }
  if ($fromGit) { $SourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path }
  $local = Read-J3w1KitFiles -KitRoot $KitRoot
  $revision = Resolve-J3w1TagRevision -Environment $environment -Kit $local.Kit -Ref $Version -SourceRoot $SourceRoot
  $pin = Get-J3w1Pin $local.Kit @{ version = $Version.Substring(1); ref = $Version; revision = $revision; profile = $local.Kit.theme.profile }
  $source = @{ Environment = $environment; Kit = $local.Kit; Pin = $pin; SourceRoot = $SourceRoot; NoCache = [bool]$PlanOnly }
  $kitFiles = Read-J3w1KitFiles -Source $source
  if ($null -eq $kitFiles) {
    Write-Warning "$Version publishes no tools/terminal-kit; using this kit's role maps ($($local.Label)) with the $Version export."
    $kitFiles = $local
  } elseif ($kitFiles.Kit.theme.repository -ne $local.Kit.theme.repository) {
    throw "The kit at $Version names another repository ($($kitFiles.Kit.theme.repository)). Refusing."
  }
  if ($fromGit) { $pinCheck = "tag $Version resolved by git in $SourceRoot" } else { $pinCheck = "tag $Version resolved through the GitHub API" }
  $context = New-J3w1Context -SourceRoot $SourceRoot -Pin $pin -KitFiles $kitFiles -Kits @($local.Kit) -NoCache:$PlanOnly -SkipPinCheck
  $context.Export.PinCheck = $pinCheck + ($context.Export.PinCheck -replace '^[^;]*', '')
  $result = Invoke-J3w1OrcaApply -Context $context -Operation 'update' -PlanOnly:$PlanOnly -SkipFontCheck:$SkipFontCheck -ShowDiff
  if ($PlanOnly) { return 0 }
  Write-Host ''
  $fails = Invoke-J3w1OrcaVerify -Context $context -NoSpecimen
  if ($result.StorePending) { Write-Host 'The store checks fail until the GUI steps above are done (or Orca is quit and Update rerun).' }
  return $(if ($fails -gt 0) { 1 } else { 0 })
}

function New-J3w1VerifyContext {
  <# Test checks what was last applied: the manifest's theme pin and, when an
     update fetched them, that revision's kit maps. The export is verified
     against the digest kit.json pins for that revision, else the digest the
     last apply recorded in its lock. #>
  param([string]$KitRoot, [string]$SourceRoot)
  $environment = Get-J3w1Environment
  $local = Read-J3w1KitFiles -KitRoot $KitRoot
  $localPin = Get-J3w1Pin $local.Kit
  $manifest = Get-J3w1CurrentManifest $environment
  if ($null -eq $manifest) { return New-J3w1Context -SourceRoot $SourceRoot -Pin $localPin -KitFiles $local }
  $theme = $manifest['theme']
  $pin = Get-J3w1Pin $local.Kit @{ version = $theme['version'].ToString(); ref = $theme['ref'].ToString(); revision = $theme['revision'].ToString(); profile = $theme['profile'].ToString() }
  if ($pin.Revision -eq $localPin.Revision) { return New-J3w1Context -SourceRoot $SourceRoot -Pin $pin -KitFiles $local }
  $kitFiles = $null
  if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
    $cached = Join-J3w1Path $environment.StateRoot "cache/$($pin.Revision)/tools/terminal-kit"
    if (Test-Path -LiteralPath (Join-J3w1Path $cached 'kit.json') -PathType Leaf) { $kitFiles = Read-J3w1KitFiles -KitRoot $cached }
  } else {
    $kitFiles = Read-J3w1KitFiles -Source @{ Environment = $environment; Kit = $local.Kit; Pin = $pin; SourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path; NoCache = $true }
  }
  if ($null -eq $kitFiles) { $kitFiles = $local }
  $recorded = $null
  $lockPath = Join-J3w1Path $environment.StateRoot 'current/theme.lock.orca.json'
  if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
    $lock = Read-J3w1Data $lockPath
    $digest = [string]$lock.exports[$kitFiles.Kit.exports.tokens]
    if ($lock.revision -eq $pin.Revision -and $digest) { $recorded = @{ Digest = $digest; Source = 'the last apply (theme.lock.orca.json)' } }
  }
  return New-J3w1Context -SourceRoot $SourceRoot -Pin $pin -KitFiles $kitFiles -Kits @($local.Kit) -PinnedDigest $recorded
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
        foreach ($pair in @(@('fgRole', $false), @('bgRole', $true))) {
          if (-not $segment.Contains($pair[0])) { continue }
          $role = $kitFiles.ClaudeRoles.roles[$segment[$pair[0]]]
          if ($null -eq $role) { throw "Specimen role $($segment[$pair[0]]) is not in roles/claude-code.json." }
          $codes.Add((Get-J3w1TrueColor (Resolve-J3w1Token $export $role.token '' $Disclosures) -Background:$pair[1]))
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
  foreach ($key in $roles.orca.settings.Keys) {
    $slot = Get-J3w1NodeAt $store $key
    $want = New-J3w1JsonNode $expected.Settings[$key]
    $ok = $slot.Present -and $null -ne $slot.Node
    if ($ok) {
      if ($want.GetValueKind() -eq [System.Text.Json.JsonValueKind]::Number) {
        $ok = $slot.Node.GetValueKind() -eq [System.Text.Json.JsonValueKind]::Number -and $slot.Node.GetValue[double]() -eq $want.GetValue[double]()
      } else {
        $ok = $slot.Node.GetValueKind() -eq $want.GetValueKind() -and $slot.Node.ToString().ToLowerInvariant() -eq $want.ToString().ToLowerInvariant()
      }
    }
    if ($roles.orca.settings[$key].Contains('preference')) {
      # The owner may change the size after apply; the kit keeps any size.
      $detail = "observed $(Format-J3w1Value $slot), $(ConvertTo-J3w1Compact $want) at the last apply"
      if (-not $ok) { $detail += '; changed since, which the kit allows (the size is yours)' }
      & $add $(if ($ok) { 'PASS' } else { 'WARN' }) $key $detail
      continue
    }
    & $add $(if ($ok) { 'PASS' } else { 'FAIL' }) $key "observed $(Format-J3w1Value $slot), expected $(ConvertTo-J3w1Compact $want)"
  }

  # Preserved keys against the last manifest, and the owner's preferences.
  if ($null -ne $manifest) {
    $changed = [System.Collections.Generic.List[string]]::new()
    foreach ($entry in $manifest['preserved']) {
      $key = $entry['key'].ToString()
      $slot = Get-J3w1NodeAt $store $key
      $then = $entry['value']
      $same = if (Test-J3w1AbsentNode $then) { -not $slot.Present } else { $slot.Present -and (Test-J3w1NodeEqual $slot.Node $then) }
      if (-not $same) { $changed.Add("$key $(ConvertTo-J3w1Compact $then) -> $(Format-J3w1Value $slot)") }
    }
    if ($changed.Count -eq 0) { & $add 'PASS' 'preserved keys' "$($manifest['preserved'].Count) keys unchanged since the last apply" }
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

function Get-J3w1RestoreTargets {
  <# The value each managed key had before one run: observed[] (every key,
     written or not), else settings[].before (a restore, or a manifest from
     before observed[] existed). #>
  param($Manifest)
  $map = [ordered]@{}
  $observed = $Manifest['observed']
  if ($null -ne $observed) {
    foreach ($entry in $observed) { $map[$entry['key'].ToString()] = @{ Value = $entry['value']; EqualsKit = $entry['equalsKit'].GetValue[bool]() } }
  } else {
    foreach ($entry in $Manifest['settings']) { $map[$entry['key'].ToString()] = @{ Value = $entry['before']; EqualsKit = $false } }
  }
  return $map
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
  <# Key-level restore. Default: undo every apply and update since the last
     complete default restore (or since the first run): per key the earliest
     value observed in that window, per file its state before the earliest
     run in the window that wrote it. A key whose earliest observation
     already held the kit's value while config.ghostty already held the
     managed block may have been written by Orca's Import from Ghostty; its
     pre-kit value is unknown, so it is left as it is and the run exits 3.
     -Latest undoes the most recent apply or update; -Backup returns to the
     state before one backup. The store is written only while Orca is not
     running (exit 2 otherwise). #>
  param($Environment, $KitFiles, [string]$Backup, [switch]$Latest, [switch]$PlanOnly)
  $backups = Get-J3w1Backups $Environment
  $isRun = { param($item) @('apply', 'update') -contains $item.Manifest['operation'].ToString() }
  $runs = @($backups | Where-Object { & $isRun $_ })
  if ($runs.Count -eq 0) { throw "No kit backups under $(Join-J3w1Path $Environment.StateRoot 'backups'); nothing to restore." }
  $mode = 'default'
  $since = $null
  if ($Backup) {
    $chosen = @($backups | Where-Object { $_.Name -eq $Backup })
    if ($chosen.Count -eq 0) { throw "No backup named '$Backup'. Available: $(($backups | ForEach-Object { $_.Name }) -join ', ')" }
    $mode = 'backup'
    $label = "the state before backup $Backup"
  } elseif ($Latest) {
    $chosen = @($runs[-1])
    $mode = 'latest'
    $label = "the state before the latest apply or update ($($runs[-1].Name))"
  } else {
    $start = 0
    for ($i = $backups.Count - 1; $i -ge 0; $i--) {
      $m = $backups[$i].Manifest
      if ($m['operation'].ToString() -ne 'restore') { continue }
      if (@($null, 'default') -notcontains (Get-J3w1ManifestText $m 'mode')) { continue }
      if (Get-J3w1ManifestBool $m 'refused' $false) { continue }
      $start = $i + 1
      $since = $backups[$i].Name
      break
    }
    $chosen = @(for ($i = $start; $i -lt $backups.Count; $i++) { if (& $isRun $backups[$i]) { $backups[$i] } })
    $label = if ($since) { "the state before the first apply or update since the restore $since" } else { "the state before the kit's first change" }
    $label += " ($($chosen.Count) run(s))"
  }

  $paths = Get-J3w1OrcaPaths $Environment
  $running = Test-J3w1OrcaRunning $Environment
  Write-Host 'j3w1 terminal kit: Orca (restore)'
  Write-Host "  target       $label"
  Write-Host "  settings     $($paths.Settings)"
  if ($chosen.Count -eq 0) {
    Write-Host ''
    Write-Host "Result: nothing to restore; no apply or update since the restore $since."
    return 0
  }

  # Per key: the earliest value in the chosen runs.
  $keys = [ordered]@{}
  foreach ($entry in $chosen) {
    $blockBefore = Get-J3w1ManifestBool $entry.Manifest 'ghosttyBlockBefore' $false
    $targets = Get-J3w1RestoreTargets $entry.Manifest
    foreach ($key in $targets.Keys) {
      if ($keys.Contains($key)) { continue }
      $keys[$key] = @{ Value = $targets[$key].Value; Unknown = ($mode -eq 'default' -and $blockBefore -and $targets[$key].EqualsKit); From = $entry.Name }
    }
  }
  $managed = Get-J3w1ManagedKeys $KitFiles
  foreach ($key in $keys.Keys) { if ($managed -notcontains $key) { throw "Backup manifest names '$key', which the kit never manages. Refusing." } }

  # config.ghostty: its state before the earliest chosen run that wrote it.
  $record = $null
  foreach ($entry in $chosen) {
    foreach ($file in $entry.Manifest['files']) {
      if ($null -ne $record -or $file['role'].ToString() -ne 'ghostty') { continue }
      $source = if ($null -ne $file['backupFile']) { Join-J3w1Path $entry.Path $file['backupFile'].ToString() } else { $null }
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
  $filePlan = Get-J3w1GhosttyRestorePlan -Current $ghostty -Target $target -KeepTargetBlock:($mode -ne 'default')

  # What the kit last wrote, to tell the owner about later edits.
  $lastWritten = @{}
  foreach ($item in $backups) {
    foreach ($file in $item.Manifest['files']) {
      $after = $file['sha256After']
      $lastWritten[$file['role'].ToString()] = @{ Digest = $(if ($null -eq $after) { $null } else { $after.ToString() }); Name = $item.Name }
    }
  }

  $storeBytes = [System.IO.File]::ReadAllBytes($paths.Settings)
  $store = Read-J3w1JsonNode $paths.Settings
  $changes = [System.Collections.Generic.List[object]]::new()
  $unknown = [System.Collections.Generic.List[object]]::new()
  foreach ($key in $keys.Keys) {
    $before = Get-J3w1NodeAt $store $key
    if ($keys[$key].Unknown) { $unknown.Add(@{ Key = $key; Current = $before; From = $keys[$key].From }); continue }
    $value = $keys[$key].Value
    $after = if (Test-J3w1AbsentNode $value) { @{ Present = $false; Node = $null } } else { @{ Present = $true; Node = $value } }
    $same = if ($after.Present) { $before.Present -and (Test-J3w1NodeEqual $before.Node $after.Node) } else { -not $before.Present }
    if (-not $same) { $changes.Add(@{ Key = $key; Before = $before; After = $after }) }
  }

  Write-Host ''
  Write-Host 'Plan:'
  if ($filePlan.Action -ne 'none') { Write-Host "  $($ghosttyPath): $($filePlan.Note)" }
  foreach ($change in $changes) { Write-Host ("  {0,-30} {1} -> {2}" -f $change.Key, (Format-J3w1Value $change.Before), (Format-J3w1Value $change.After)) }
  foreach ($item in $unknown) { Write-Host ("  {0,-30} left as {1}: cannot know the pre-kit value" -f $item.Key, (Format-J3w1Value $item.Current)) }
  if ($ghostty.Exists -and $lastWritten.Contains('ghostty') -and $lastWritten['ghostty'].Digest -ne (Get-J3w1Digest $ghostty.Bytes)) {
    Write-Warning "$ghosttyPath changed since the kit last wrote it (backup $($lastWritten['ghostty'].Name)). Only the managed block is taken out; every other line stays."
  }
  if ($lastWritten.Contains('store') -and $lastWritten['store'].Digest -ne (Get-J3w1Digest $storeBytes)) {
    Write-Warning "$($paths.Settings) changed since the kit last wrote it (backup $($lastWritten['store'].Name)); Orca rewrites it on every change, so this is expected. Only the managed keys are restored; every other value stays."
  }
  if ($unknown.Count -gt 0) {
    Write-Host ''
    Write-Host "Cannot know the pre-kit value of $(($unknown | ForEach-Object { $_.Key }) -join ', '): the earliest kit record"
    Write-Host "($($unknown[0].From)) already found the kit's value while config.ghostty held the managed block, which is"
    Write-Host "what Orca's Import from Ghostty writes. These keys are left as they are; set them in Orca if you want other values."
  }
  $storeRefused = $changes.Count -gt 0 -and $running
  if ($storeRefused) {
    Write-Host ''
    Write-Host 'Orca is running: the store part is refused. Orca holds its settings in memory and would overwrite'
    Write-Host 'the file; quit Orca (tray too) and rerun to restore those keys. Ghostty files are restored now.'
  }
  $doStore = $changes.Count -gt 0 -and -not $running
  $doFile = @('write', 'delete') -contains $filePlan.Action
  $code = if ($storeRefused) { 2 } elseif ($unknown.Count -gt 0) { 3 } else { 0 }
  if (-not $doStore -and -not $doFile) {
    Write-Host ''
    if ($unknown.Count -gt 0) { Write-Host "Result: nothing restored; $($unknown.Count) key(s) left as they are because their pre-kit value is unknown." }
    elseif ($storeRefused) { Write-Host 'Result: nothing written; quit Orca (tray too) and rerun.' }
    else { Write-Host 'Result: nothing to restore.' }
    return $code
  }
  if ($PlanOnly) {
    Write-Host ''
    Write-Host 'Result: -WhatIf, nothing written.'
    return 0
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
  $manifest = [System.Text.Json.Nodes.JsonObject]::new()
  $manifest['schemaVersion'] = New-J3w1JsonNode 1
  $manifest['kit'] = New-J3w1JsonNode $KitFiles.Kit.id
  $manifest['operation'] = New-J3w1JsonNode 'restore'
  $manifest['timestamp'] = New-J3w1JsonNode (Get-J3w1Timestamp)
  $manifest['mode'] = New-J3w1JsonNode $mode
  $manifest['restoredTo'] = New-J3w1JsonNode $label
  $manifest['storeWritten'] = New-J3w1JsonNode $doStore
  $manifest['refused'] = New-J3w1JsonNode $storeRefused
  $manifest['unknown'] = New-J3w1JsonNode @($unknown | ForEach-Object { $_.Key })
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
  $preKit = Get-J3w1PreKitStorePath $Environment
  $savePreKit = $doStore -and -not (Test-Path -LiteralPath $preKit -PathType Leaf)
  if ($doStore -and (Test-J3w1OrcaRunning $Environment)) { throw 'Orca started during the restore; nothing was written. Quit Orca (tray too) and rerun.' }

  # Back up the current state, then write.
  $snapshot = New-J3w1BackupFolder $Environment
  if ($savePreKit) { Write-J3w1Bytes -Path $preKit -Bytes $storeBytes }
  if ($doFile) { [System.IO.File]::WriteAllBytes((Join-J3w1Path $snapshot.Path 'config.ghostty'), $ghostty.Bytes) }
  Write-J3w1Text (Join-J3w1Path $snapshot.Path 'manifest.json') $manifestText
  if ($filePlan.Action -eq 'delete') { Remove-Item -LiteralPath $ghosttyPath -Force }
  elseif ($doFile) { Write-J3w1Bytes -Path $ghosttyPath -Bytes $filePlan.Bytes }
  if ($doStore) {
    if (Test-J3w1OrcaRunning $Environment) { throw 'Orca started during the restore; the store was not written. Quit Orca (tray too) and rerun.' }
    Write-J3w1Text $paths.Settings $storeText
  }
  if (-not $storeRefused) {
    # The kit is no longer the last thing applied; Test reports that.
    $current = Join-J3w1Path $Environment.StateRoot 'current'
    foreach ($name in 'manifest.json', 'config.ghostty.block', 'theme.lock.orca.json') {
      Remove-Item -LiteralPath (Join-J3w1Path $current $name) -Force -ErrorAction SilentlyContinue
    }
  }
  Write-Host ''
  if ($unknown.Count -gt 0) {
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
