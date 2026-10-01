# j3w1 unified Windows installer v1
<# One entry point for installation, updates, checks and offline recovery.
   Starts in Windows PowerShell 5.1; retains a verified standalone runtime when
   the available PowerShell cannot access the native, unpackaged registry view.
   -Lifecycle is an internal dispatch flag, never a second installer. #>
[CmdletBinding()]
param(
 [ValidateSet('Plan','Prepare','Apply','Update','Test','Restore','Uninstall','Guard')][string]$Action='Apply',
 [ValidateSet('Auto','Full','Native')][string]$Mode='Auto',
 [string]$Revision,[string]$Version,[string]$SourceRoot,
 [string]$StateRoot=(Join-Path $env:LOCALAPPDATA 'j3w1-theme\windows'),
 [switch]$NonInteractive,[switch]$Latest,
 [switch]$Fixture,[int]$FixtureFailAfter=0,
 [switch]$Lifecycle
)
function Assert-J3w1SetupPath([string]$Path) {
 $p=[IO.Path]::GetFullPath($Path)
 while($p){
  if(Test-Path -LiteralPath $p){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw "Reparse target refused: $p"}}
  $parent=[IO.Path]::GetDirectoryName($p);if($parent -eq $p){break};$p=$parent
 }
}
function Get-J3w1SetupFile([string]$Uri,[string]$Path,[string]$Sha256,[switch]$Offline) {
 Assert-J3w1SetupPath $Path
 if(Test-Path -LiteralPath $Path){
  if($Sha256 -and (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -eq $Sha256){return}
  throw "Existing setup file differs or is unverified: $Path"
 }
 if($Offline){throw "Required offline recovery file is missing: $Path. Restore the saved cache; no download was attempted."}
 $pending=$Path+'.download-'+[guid]::NewGuid().ToString('N')
 $previousProgress=$ProgressPreference
 try {
  # Windows PowerShell 5.1 progress rendering can dominate large downloads.
  $ProgressPreference='SilentlyContinue'
  $readTimeout=@{};if($PSVersionTable.PSVersion -ge [version]'7.4'){$readTimeout.OperationTimeoutSeconds=60}
  Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $pending -TimeoutSec 300 @readTimeout -ErrorAction Stop
  if($Sha256 -and (Get-FileHash -LiteralPath $pending -Algorithm SHA256).Hash -ne $Sha256){throw 'Setup download digest mismatch'}
  Assert-J3w1SetupPath $Path;[IO.File]::Move($pending,$Path)
 } finally {$ProgressPreference=$previousProgress;if(Test-Path -LiteralPath $pending){Remove-Item -LiteralPath $pending}}
}
function Resolve-J3w1SetupRevision([string]$Revision,[string]$Version) {
 if($Revision -and $Version){throw 'Choose either -Revision or -Version, not both.'}
 if($Version){
  if($Version -cnotmatch '^v\d+\.\d+\.\d+$'){throw 'Use an explicit release tag such as v4.0.0.'}
  $readTimeout=@{};if($PSVersionTable.PSVersion -ge [version]'7.4'){$readTimeout.OperationTimeoutSeconds=60}
  $ref=Invoke-RestMethod -Uri "https://api.github.com/repos/j3w1/theme/git/ref/tags/$Version" -TimeoutSec 60 @readTimeout -ErrorAction Stop
  if($ref.object.type -eq 'tag'){
   if($ref.object.sha -cnotmatch '^[0-9a-f]{40}$'){throw 'Invalid annotated tag identity'}
   $ref=Invoke-RestMethod -Uri "https://api.github.com/repos/j3w1/theme/git/tags/$($ref.object.sha)" -TimeoutSec 60 @readTimeout -ErrorAction Stop
  }
  if($ref.object.type -ne 'commit'){throw 'Release tag does not resolve to a commit'}
  $Revision=$ref.object.sha
 }
 if($Revision -cnotmatch '^[0-9a-f]{40}$'){throw 'Supply a full immutable commit with -Revision, or a published tag with -Version.'}
 return $Revision
}
function Find-J3w1SetupPowerShell {
 # Store PowerShell can expose a different registry view. Use the ordinary
 # system install, otherwise the verified private runtime retained by setup.
 $candidates=@(Join-Path $env:ProgramFiles 'PowerShell\7\pwsh.exe')
 foreach($candidate in ($candidates|Select-Object -Unique)){
  if(Test-Path -LiteralPath $candidate -PathType Leaf){
   $reported=& $candidate -NoProfile -NonInteractive -Command '$PSVersionTable.PSVersion.ToString()'
   if($LASTEXITCODE -eq 0 -and "$reported" -match '^\d+\.\d+\.\d+$' -and [version]$reported -ge [version]'7.4'){return $candidate}
  }
 }
 return $null
}
function Install-J3w1SetupPowerShell($Pin,[string]$Root,[switch]$Offline) {
 if($Pin.version -cnotmatch '^\d+\.\d+\.\d+$' -or $Pin.sha256 -cnotmatch '^[0-9a-f]{64}$' -or $Pin.url -cne "https://github.com/PowerShell/PowerShell/releases/download/v$($Pin.version)/PowerShell-$($Pin.version)-win-x64.zip"){throw 'Invalid PowerShell dependency pin'}
 $tools=Join-Path $Root 'tools\powershell';Assert-J3w1SetupPath $tools;[IO.Directory]::CreateDirectory($tools)|Out-Null
 $archive=Join-Path $tools "PowerShell-$($Pin.version)-win-x64.zip"
 if(Test-Path -LiteralPath $archive){Write-Host 'Verifying the cached PowerShell archive; no download is needed.'}
 elseif(-not $Offline){Write-Host 'Downloading the pinned Microsoft PowerShell archive...'}
 Get-J3w1SetupFile $Pin.url $archive $Pin.sha256 -Offline:$Offline
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $destination=Join-Path $tools $Pin.version;Assert-J3w1SetupPath $destination
 $existing=Test-Path -LiteralPath $destination
 if($existing){Write-Host 'Verifying retained PowerShell files and publisher. This can take a minute.'}
 else{Write-Host 'Extracting the verified PowerShell runtime...'}
 $stage=if($existing){$destination}else{Join-Path $tools ($Pin.version+'.pending-'+[guid]::NewGuid().ToString('N'))}
 Assert-J3w1SetupPath $stage;[IO.Directory]::CreateDirectory($stage)|Out-Null
 $zip=[IO.Compression.ZipFile]::OpenRead($archive)
 try {
  $rootPrefix=[IO.Path]::GetFullPath($stage).TrimEnd('\')+'\'
  $seen=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  $total=0L
  foreach($entry in $zip.Entries){
   $name=$entry.FullName.Replace('/','\')
   if($name.StartsWith('\') -or $name.Contains(':') -or $name.Split('\') -contains '..' -or (($entry.ExternalAttributes -shr 16) -band 0xf000) -eq 0xa000){throw 'Unsafe PowerShell archive entry'}
   $path=[IO.Path]::GetFullPath((Join-Path $stage $name))
   if(-not $path.StartsWith($rootPrefix,[StringComparison]::OrdinalIgnoreCase)){throw 'PowerShell archive escaped its directory'}
   if($name.EndsWith('\')){continue}
   if(-not $seen.Add($path)){throw 'Duplicate PowerShell archive entry'}
   $total+=$entry.Length;if($entry.Length -gt 300MB -or $total -gt 1GB){throw 'PowerShell archive exceeds extraction limit'}
   Assert-J3w1SetupPath $path
   if($existing){
    if(-not(Test-Path -LiteralPath $path -PathType Leaf)){throw 'Retained PowerShell is incomplete'}
    $stream=$entry.Open();$hasher=[Security.Cryptography.SHA256]::Create()
    try{$digest=([BitConverter]::ToString($hasher.ComputeHash($stream))).Replace('-','')}finally{$stream.Dispose();$hasher.Dispose()}
    if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne $digest){throw 'Retained PowerShell differs from its pinned archive'}
   }else{
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($path))|Out-Null
    [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$path,$false)
   }
  }
  if($existing){
   $queue=[Collections.Generic.Queue[string]]::new();$queue.Enqueue($stage)
   while($queue.Count){foreach($item in Get-ChildItem -LiteralPath $queue.Dequeue() -Force){
    Assert-J3w1SetupPath $item.FullName
    if($item.PSIsContainer){$queue.Enqueue($item.FullName)}elseif(-not $seen.Contains($item.FullName)){throw 'Unexpected file in retained PowerShell'}
   }}
  }
  $exe=Join-Path $stage 'pwsh.exe';$signature=Get-AuthenticodeSignature -LiteralPath $exe
  if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'O=Microsoft Corporation(?:,|$)'){throw 'PowerShell publisher verification failed'}
  if(-not $existing){Assert-J3w1SetupPath $destination;[IO.Directory]::Move($stage,$destination)}
  return (Join-Path $destination 'pwsh.exe')
 } finally {
  $zip.Dispose()
  if(-not $existing -and(Test-Path -LiteralPath $stage)){
   $resolved=[IO.Path]::GetFullPath($stage);$allowed=[IO.Path]::GetFullPath($tools).TrimEnd('\')+'\'
   if(-not $resolved.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($resolved) -notlike '*.pending-*'){throw 'Unsafe setup cleanup refused'}
   Assert-J3w1SetupPath $resolved;Remove-Item -LiteralPath $resolved -Recurse -Force
  }
 }
}
function Invoke-J3w1SetupLifecycle([string]$PowerShell,[string]$Installer,[string]$Action,[string]$Mode,[string]$Revision,[string]$StateRoot,[switch]$Latest) {
 $arguments=@('-NoProfile','-NonInteractive','-File',$Installer,'-Action',$Action,'-Mode',$Mode,'-StateRoot',$StateRoot)
 # Verified historical releases use the earlier entry point without this flag.
 if((Get-Content -LiteralPath $Installer -TotalCount 1) -ceq '# j3w1 unified Windows installer v1'){$arguments+='-Lifecycle'}
 if($Revision){$arguments+=@('-Revision',$Revision)}
 if($Latest){$arguments+='-Latest'}
 $result=& $PowerShell @arguments
 if($LASTEXITCODE -ne 0){throw "Windows theme $Action failed (exit $LASTEXITCODE). See the printed recovery commands."}
 return $result
}
function Select-J3w1SetupMode($Plan,[string]$Mode,[bool]$NonInteractive) {
 if($null -eq $Plan -or $Plan.compatible -isnot [bool]){throw 'Invalid compatibility preflight result'}
 if($Mode -eq 'Native'){return 'Native'}
 if($Plan.compatible){return 'Full'}
 Write-Host 'This Windows/shell fingerprint is not supported for Full styling.'
 Write-Host 'Native mode includes personalization, cursors, wallpaper and supported existing app settings; it omits Windhawk shell styling.'
 if($Mode -eq 'Full' -or $NonInteractive){throw 'Full mode is unavailable. Rerun with -Mode Native only if you want that limited mode.'}
 if((Read-Host 'Type N to install Native mode, or press Enter to cancel') -cne 'N'){throw 'Setup cancelled; theme settings were not changed.'}
 return 'Native'
}
function Get-J3w1SetupRecovery([string]$PowerShell,[string]$Installer,[string]$StateRoot) {
 $prefix="& '"+$PowerShell.Replace("'","''")+"' -NoProfile -File '"+$Installer.Replace("'","''")+"' -StateRoot '"+$StateRoot.Replace("'","''")+"'"
 return @("$prefix -Action Test","$prefix -Action Restore -Latest","$prefix -Action Restore","$prefix -Action Uninstall")
}
function Save-J3w1SetupRecovery([string]$PowerShell,[string]$Installer,[string]$StateRoot) {
 $commands=Get-J3w1SetupRecovery $PowerShell $Installer $StateRoot
 $file=Join-Path $StateRoot 'recovery-commands.txt';Assert-J3w1SetupPath $file
 $pending=$file+'.pending-'+[guid]::NewGuid().ToString('N');Assert-J3w1SetupPath $pending
 try {
  [IO.File]::WriteAllLines($pending,$commands)
  Assert-J3w1SetupPath $file
  if(Test-Path -LiteralPath $file){[IO.File]::Replace($pending,$file,[NullString]::Value)}else{[IO.File]::Move($pending,$file)}
 } finally {if(Test-Path -LiteralPath $pending){Remove-Item -LiteralPath $pending}}
 Write-Host "Recovery commands (also saved in $file):"
 $commands|ForEach-Object {Write-Host $_}
}
function Sync-J3w1SetupRecovery([string]$PowerShell,[string]$StateRoot) {
 $current=Join-Path $StateRoot 'current.json';Assert-J3w1SetupPath $current
 if(-not(Test-Path -LiteralPath $current)){return}
 $pointer=Get-Content -LiteralPath $current -Raw|ConvertFrom-Json
 $verified=Get-J3w1VerifiedRecoveryRelease $StateRoot $pointer.revision
 Save-J3w1SetupRecovery $PowerShell (Join-Path $verified.path 'install.ps1') $StateRoot
}
function Get-J3w1VerifiedRecoveryRelease([string]$StateRoot,[string]$Revision) {
 if($Revision -cnotmatch '^[0-9a-f]{40}$'){throw 'Invalid recovery release identity'}
 $release=Join-Path $StateRoot "releases\$Revision";Assert-J3w1SetupPath $release
 $manifestPath=Join-Path $release 'install-manifest.json';$markerPath=Join-Path $release 'verified.json'
 foreach($path in @($manifestPath,$markerPath)){Assert-J3w1SetupPath $path;if(-not(Test-Path -LiteralPath $path)){throw 'Recovery cache is missing. Restore the saved cache; no download was attempted.'}}
 $marker=Get-Content -LiteralPath $markerPath -Raw|ConvertFrom-Json
 if($marker.revision -ne $Revision -or (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash -ne $marker.manifestSha256){throw 'Recovery manifest changed'}
 $manifest=Get-Content -LiteralPath $manifestPath -Raw|ConvertFrom-Json
 if($manifest.schemaVersion -ne 1){throw 'Unsupported recovery manifest'}
 foreach($name in @('install.ps1','dependencies.json')){
  $entry=@($manifest.files|Where-Object path -CEQ $name);$file=Join-Path $release $name;Assert-J3w1SetupPath $file
  if($entry.Count -ne 1 -or $entry[0].sha256 -cnotmatch '^[0-9a-f]{64}$' -or -not(Test-Path -LiteralPath $file) -or (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry[0].sha256){throw "Recovery file is missing or changed: $name"}
 }
 return @{path=$release;dependencies=(Get-Content -LiteralPath (Join-Path $release 'dependencies.json') -Raw|ConvertFrom-Json)}
}
function Get-J3w1RecoveryPowerShellPin($Release,[string]$StateRoot) {
 $pin=$Release.dependencies.PSObject.Properties['powershell']
 if($pin){return $pin.Value}
 # A rollback can select a release that predates setup. The retained runtime
 # belongs to setup, not to the theme revision being restored. Recover its pin
 # from verified installation history, including rolled-back transactions.
 $journal=Join-Path $StateRoot 'journal.json';Assert-J3w1SetupPath $journal
 if(Test-Path -LiteralPath $journal){
  $history=Get-Content -LiteralPath $journal -Raw|ConvertFrom-Json
  if($history.schemaVersion -ne 1){throw 'Unsupported recovery journal'}
  $transactions=@($history.transactions);[array]::Reverse($transactions)
  $seen=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach($transaction in $transactions){
   if(-not $seen.Add([string]$transaction.revision)){continue}
   $candidate=Get-J3w1VerifiedRecoveryRelease $StateRoot $transaction.revision
   $pin=$candidate.dependencies.PSObject.Properties['powershell']
   if($pin){return $pin.Value}
  }
 }
 throw 'No verified offline PowerShell dependency pin was found. Restore the saved setup release cache; no download was attempted.'
}
function Invoke-J3w1WindowsRecovery([string]$Action,[bool]$Latest,[string]$StateRoot) {
 if($env:OS -ne 'Windows_NT'){throw 'Run recovery on native Windows'}
 $StateRoot=[IO.Path]::GetFullPath($StateRoot);Assert-J3w1SetupPath $StateRoot
 $pointer=$null
 if($Action -in 'Restore','Uninstall'){
  $journal=Join-Path $StateRoot 'journal.json';Assert-J3w1SetupPath $journal
  if(Test-Path -LiteralPath $journal){
   $history=Get-Content -LiteralPath $journal -Raw|ConvertFrom-Json
   if($history.schemaVersion -ne 1){throw 'Unsupported recovery journal'}
   $pointer=@($history.transactions|Where-Object status -NE 'restored'|Select-Object -Last 1)
   if($pointer.Count){$pointer=$pointer[0]}else{$pointer=$null}
  }
 }
 if(-not $pointer){
  $current=Join-Path $StateRoot 'current.json';Assert-J3w1SetupPath $current
  if(-not(Test-Path -LiteralPath $current)){throw 'No installed theme or pending transaction was found. Nothing to recover.'}
  $pointer=Get-Content -LiteralPath $current -Raw|ConvertFrom-Json
 }
 if($pointer.revision -cnotmatch '^[0-9a-f]{40}$' -or $pointer.mode -notin 'Full','Native'){throw 'Invalid installed recovery identity'}
 $verifiedRelease=Get-J3w1VerifiedRecoveryRelease $StateRoot $pointer.revision
 $release=$verifiedRelease.path
 $powerShell=Find-J3w1SetupPowerShell
 if(-not $powerShell){
  $pin=Get-J3w1RecoveryPowerShellPin $verifiedRelease $StateRoot
  $powerShell=Install-J3w1SetupPowerShell $pin $StateRoot -Offline
 }
 Write-Host "Running $Action using verified local recovery data. No release download is needed."
 Invoke-J3w1SetupLifecycle $powerShell (Join-Path $release 'install.ps1') $Action $pointer.mode '' $StateRoot -Latest:$Latest|Write-Output
 if($Action -in 'Restore','Uninstall'){Sync-J3w1SetupRecovery $powerShell $StateRoot}
 Write-Host "$Action completed. Reopen affected apps to see the restored appearance."
}
function Invoke-J3w1WindowsSetup([string]$Revision,[string]$Version,[string]$Mode,[bool]$NonInteractive,[string]$StateRoot) {
 if($env:OS -ne 'Windows_NT' -or -not [Environment]::Is64BitProcess -or $env:PROCESSOR_ARCHITECTURE -ne 'AMD64'){throw 'Run setup in native 64-bit Windows PowerShell on Windows 11 x64.'}
 if([int](Get-ItemPropertyValue 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' 'CurrentBuildNumber') -lt 22000){throw 'Windows 11 is required'}
 $StateRoot=[IO.Path]::GetFullPath($StateRoot);Assert-J3w1SetupPath $StateRoot
 # TLS 1.2 is required by GitHub on Windows PowerShell 5.1; no certificate bypass.
 [Net.ServicePointManager]::SecurityProtocol=[Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
 $Revision=Resolve-J3w1SetupRevision $Revision $Version
 [IO.Directory]::CreateDirectory($StateRoot)|Out-Null
 $lockPath=Join-Path $StateRoot 'setup.lock';Assert-J3w1SetupPath $lockPath
 try{$lock=[IO.File]::Open($lockPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)}catch{throw 'Another setup owns setup.lock; do not remove a live setup lock.'}
 try{
  $bytes=[Text.Encoding]::UTF8.GetBytes("pid=$PID");$lock.Write($bytes,0,$bytes.Length);$lock.Flush($true)
  $cached=Join-Path $StateRoot "releases\$Revision";Assert-J3w1SetupPath $cached
  if(Test-Path -LiteralPath $cached){
   # A prepared immutable release must not depend on another network fetch.
   # Verify bootstrap bytes here; Prepare validates the full release before use.
   $verified=Get-J3w1VerifiedRecoveryRelease $StateRoot $Revision
   $installer=Join-Path $verified.path 'install.ps1';$deps=$verified.dependencies
   Write-Host 'Reusing the verified local release; no bootstrap download is needed.'
  }else{
   $stage=Join-Path $StateRoot ('setup-'+[guid]::NewGuid().ToString('N'));Assert-J3w1SetupPath $stage;[IO.Directory]::CreateDirectory($stage)|Out-Null
   $base="https://raw.githubusercontent.com/j3w1/theme/$Revision/ports/windows"
   $manifestPath=Join-Path $stage 'install-manifest.json';Get-J3w1SetupFile "$base/dist/install-manifest.json" $manifestPath ''
   $manifest=Get-Content -LiteralPath $manifestPath -Raw|ConvertFrom-Json
   if($manifest.schemaVersion -ne 1){throw 'Unsupported install manifest'}
   foreach($name in @('install.ps1','dependencies.json')){
    $entry=@($manifest.files|Where-Object path -CEQ $name)
    if($entry.Count -ne 1 -or $entry[0].sha256 -cnotmatch '^[0-9a-f]{64}$'){throw "Invalid manifest entry for $name"}
    Get-J3w1SetupFile "$base/$name" (Join-Path $stage $name) $entry[0].sha256
   }
   $installer=Join-Path $stage 'install.ps1';$deps=Get-Content -LiteralPath (Join-Path $stage 'dependencies.json') -Raw|ConvertFrom-Json
  }
  Write-Host "Preparing j3w1 Windows from immutable revision $Revision"
  $powerShell=Find-J3w1SetupPowerShell
  if(-not $powerShell){Write-Host 'Checking the pinned private PowerShell runtime...';$powerShell=Install-J3w1SetupPowerShell $deps.powershell $StateRoot}
  Write-Host 'Preparing verified files and Node if needed; checking shell compatibility...'
  $plan=(Invoke-J3w1SetupLifecycle $powerShell $installer 'Prepare' 'Full' $Revision $StateRoot)|ConvertFrom-Json
  $chosen=Select-J3w1SetupMode $plan $Mode $NonInteractive
  $retained=Join-Path $StateRoot "releases\$Revision\install.ps1"
  Save-J3w1SetupRecovery $powerShell $retained $StateRoot
  Write-Host "Installing $chosen mode. PowerToys and Terminal are optional; existing installations are themed where supported."
  Invoke-J3w1SetupLifecycle $powerShell $installer 'Apply' $chosen $Revision $StateRoot|Write-Output
  Invoke-J3w1SetupLifecycle $powerShell $retained 'Test' $chosen $Revision $StateRoot|Write-Output
  Write-Host "j3w1 $chosen installation and settings verification passed. Reopen affected apps and inspect the appearance."
 } finally {
  $lock.Dispose();Remove-Item -LiteralPath $lockPath
  # Retain the small verified setup inputs for diagnosis; never remove user files.
 }
}

function Invoke-J3w1WindowsLifecycle {
param(
 [ValidateSet('Plan','Prepare','Apply','Update','Test','Restore','Uninstall','Guard')][string]$Action='Plan',
 [ValidateSet('Full','Native')][string]$Mode='Full',
 [string]$Revision,[string]$Version,[string]$SourceRoot,
 [string]$StateRoot=(Join-Path $env:LOCALAPPDATA 'j3w1-theme\windows'),
 [switch]$Latest,
 [switch]$Fixture,
 [int]$FixtureFailAfter=0
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$explicitOfflineRecovery=$SourceRoot -and ($Revision -or $Version)
if(-not $IsWindows -and -not $Fixture){throw 'Run this installer on native Windows.'}
if($PSVersionTable.PSVersion -lt [version]'7.4'){throw 'PowerShell 7.4+ is required.'}
if(-not $Fixture -and (Get-Process -Id $PID).Path -match '\\WindowsApps\\'){throw 'Packaged PowerShell registry views are unsupported. Run install.ps1 from Windows PowerShell to use a verified standalone runtime.'}
function Assert-SafePath([string]$Path){
 $p=[IO.Path]::GetFullPath($Path)
 while($p){if(Test-Path -LiteralPath $p){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw "Reparse target refused: $p"}};$parent=[IO.Path]::GetDirectoryName($p);if($parent -eq $p){break};$p=$parent}
}
$StateRoot=[IO.Path]::GetFullPath($StateRoot)
Assert-SafePath $StateRoot
function Assert-ReleaseManifest($Manifest){
 if($Manifest.schemaVersion -ne 1 -or -not $Manifest.files -or $Manifest.files.Count -lt 6){throw 'Invalid release manifest'}
 $seen=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
 foreach($entry in $Manifest.files){
  if($entry.path -notmatch '^(dist/[a-z0-9][a-z0-9.-]*|install\.ps1|adapter\.ps1|lockscreen\.ps1|dependencies\.json|host\.json)$' -or $entry.path.Contains('..') -or $entry.sha256 -notmatch '^[0-9a-f]{64}$' -or -not $seen.Add($entry.path)){throw 'Unsafe, duplicate or malformed release manifest entry'}
 }
 foreach($required in @('dist/runtime.cjs','dist/windows-settings.json','install.ps1','adapter.ps1','lockscreen.ps1','dependencies.json','host.json')){if(-not $seen.Contains($required)){throw "Incomplete release: $required"}}
}

function Get-PinnedFile([string]$Relative,[string]$Destination){
 if($Relative -notmatch '^[a-zA-Z0-9_./-]+$' -or $Relative.Split('/') -contains '..'){throw 'Unsafe release file path'}
 Assert-SafePath $Destination
 [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($Destination))|Out-Null
 if($SourceRoot){
  $start=[Diagnostics.ProcessStartInfo]::new('git');$start.UseShellExecute=$false;$start.RedirectStandardOutput=$true;$start.RedirectStandardError=$true;$start.CreateNoWindow=$true
  foreach($a in @('-C',[IO.Path]::GetFullPath($SourceRoot),'show',"${Revision}:$Relative")){$start.ArgumentList.Add($a)}
  $proc=[Diagnostics.Process]::Start($start);$stream=[IO.File]::Create($Destination)
  try{$proc.StandardOutput.BaseStream.CopyTo($stream)}finally{$stream.Dispose()}
  $err=$proc.StandardError.ReadToEnd();$proc.WaitForExit();if($proc.ExitCode -ne 0){throw "Pinned Git read failed: $Relative; $err"}
 }else{Invoke-WebRequest -Uri "https://raw.githubusercontent.com/j3w1/theme/$Revision/$Relative" -OutFile $Destination -TimeoutSec 60 -OperationTimeoutSeconds 60}
}
function Get-VerifiedDownload($Item,[string]$Destination){
 Assert-SafePath $Destination
 if(Test-Path -LiteralPath $Destination){
  if((Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Item.sha256){throw "Dependency digest mismatch: $Destination"}
  return
 }
 $pending=$Destination+'.download-'+[guid]::NewGuid().ToString('N')
 try{
  Invoke-WebRequest -Uri $Item.url -OutFile $pending -TimeoutSec 180 -OperationTimeoutSeconds 60
  if((Get-FileHash -LiteralPath $pending -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Item.sha256){throw "Dependency digest mismatch: $Destination"}
  Assert-SafePath $Destination
  [IO.File]::Move($pending,$Destination)
 }finally{if(Test-Path -LiteralPath $pending){Remove-Item -LiteralPath $pending}}
}
function Write-PrivateJson($Path,$Value){
 Assert-SafePath $Path
 $temp=$Path+'.tmp-'+[guid]::NewGuid().ToString('N')
 $bytes=[Text.Encoding]::UTF8.GetBytes(($Value|ConvertTo-Json -Depth 8))
 try{
  $stream=[IO.File]::Open($temp,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  try{$stream.Write($bytes);$stream.Flush($true)}finally{$stream.Dispose()}
  Assert-SafePath $Path;[IO.File]::Move($temp,$Path,$true)
 }finally{if(Test-Path -LiteralPath $temp){Remove-Item -LiteralPath $temp}}
}
function Test-ThemeFont {
 if($Fixture){return (Test-Path -LiteralPath (Join-Path $StateRoot 'fixture/font-registered.json'))}

 foreach($keyPath in @('HKCU:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts','HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts')){
  if(Test-Path -LiteralPath $keyPath){if(@((Get-Item -LiteralPath $keyPath).GetValueNames()|Where-Object {$_ -match '^SauceCodePro NFM(?: Regular)? \(TrueType\)$'}).Count){return $true}}
 }
 return $false
}
function Install-ThemeFont($Font,[string]$Downloads){
 $receipt=Join-Path $StateRoot 'font-dependency.json';Assert-SafePath $receipt
 $previous=if(Test-Path -LiteralPath $receipt){Get-Content -LiteralPath $receipt -Raw|ConvertFrom-Json}else{$null}
 if((Test-ThemeFont) -and (-not $previous -or $previous.status -eq 'installed')){return}
 if($previous -and $previous.sourceSha256 -ne $Font.sha256){throw 'An incomplete font dependency from a different pin needs recovery first'}
 $archive=Join-Path $Downloads 'SourceCodePro.zip';Get-VerifiedDownload $Font $archive
 $folder=if($Fixture){Join-Path $StateRoot 'fixture/fonts'}else{Join-Path $env:LOCALAPPDATA 'Microsoft/Windows/Fonts'};Assert-SafePath $folder
 [IO.Directory]::CreateDirectory($folder)|Out-Null
 $fontKey='HKCU:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts'
 if(-not $Fixture -and -not(Test-Path -LiteralPath $fontKey)){New-Item -Path $fontKey -Force|Out-Null}
 $zip=[IO.Compression.ZipFile]::OpenRead($archive)
 try{
  # Extract only reviewed flat filenames; never expand an archive over a user folder.
  $selected=@()
  foreach($entry in $Font.files.PSObject.Properties){
   $matches=@($zip.Entries|Where-Object FullName -eq $entry.Name)
   if($matches.Count -ne 1 -or $matches[0].Length -gt 20000000){throw "Missing or invalid pinned font entry: $($entry.Name)"}
   $destination=Join-Path $folder $entry.Name;Assert-SafePath $destination
   $input=$matches[0].Open();$memory=[IO.MemoryStream]::new()
   try{$input.CopyTo($memory);$bytes=$memory.ToArray()}finally{$input.Dispose();$memory.Dispose()}
   $digest=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes))
   if(Test-Path -LiteralPath $destination){
    $owned=$previous -and @($previous.owned|Where-Object {$_.path -eq $destination -and $_.sha256 -eq $digest}).Count -eq 1
    if(-not $owned -or (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash -ne $digest){throw "An unowned or changed font occupies $destination; resolve it before retrying"}
   }
   $selected+=@{zip=$matches[0];path=$destination;name=$entry.Value;sha256=$digest}

  }
  if(-not $Fixture){Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class J3w1FontLoader {
 [DllImport("gdi32.dll",CharSet=CharSet.Unicode)] public static extern int AddFontResourceEx(string path,uint flags,IntPtr reserved);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern IntPtr SendMessageTimeout(IntPtr window,uint msg,UIntPtr wParam,IntPtr lParam,uint flags,uint timeout,out UIntPtr result);
}
'@
  }
  $owned=@($selected|ForEach-Object {@{path=$_.path;name=$_.name;sha256=$_.sha256}})
  $progress=@{status='installing';version=$Font.version;sourceSha256=$Font.sha256;owned=$owned;retainedOnThemeRestore=$true}
  Write-PrivateJson $receipt $progress
  $completed=0
  foreach($item in $selected){
   if(-not(Test-Path -LiteralPath $item.path)){[IO.Compression.ZipFileExtensions]::ExtractToFile($item.zip,$item.path,$false)}
   if(-not $Fixture){New-ItemProperty -LiteralPath $fontKey -Name $item.name -Value $item.path -PropertyType String -Force|Out-Null
   if([J3w1FontLoader]::AddFontResourceEx($item.path,0,[IntPtr]::Zero) -eq 0){throw 'Font registration failed; font dependency retained for diagnosis'}
   }else{@{registered=$true}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $StateRoot 'fixture/font-registered.json')}
   $completed++
   if($Fixture -and $FixtureFailAfter -eq $completed){throw 'Injected font interruption'}
  }
  $progress.status='installed';Write-PrivateJson $receipt $progress
  if(-not $Fixture){$result=[UIntPtr]::Zero;[void][J3w1FontLoader]::SendMessageTimeout([IntPtr]0xffff,0x1d,[UIntPtr]::Zero,[IntPtr]::Zero,2,2000,[ref]$result)}
 }finally{$zip.Dispose()}
 if(-not(Test-ThemeFont)){throw 'Font registration readback failed'}
}
if($Action -eq 'Update' -and -not $Version -and -not $Revision){throw 'Update requires an explicit -Version or -Revision.'}
if($Version){
 if($Version -notmatch '^v\d+\.\d+\.\d+$'){throw 'Supply an explicit release tag.'}
 if($SourceRoot){
  $Revision=(& git -C $SourceRoot rev-parse --verify "refs/tags/$Version^{commit}").Trim()
  if($LASTEXITCODE){throw 'Requested release tag is unavailable in the offline source'}
 }else{
 $ref=Invoke-RestMethod "https://api.github.com/repos/j3w1/theme/git/ref/tags/$Version" -TimeoutSec 60 -OperationTimeoutSeconds 60
 if($ref.object.type -eq 'tag'){$tag=Invoke-RestMethod $ref.object.url -TimeoutSec 60 -OperationTimeoutSeconds 60;$Revision=$tag.object.sha}else{$Revision=$ref.object.sha}
 }
}
$current=Join-Path $StateRoot 'current.json'
if(-not $Revision -and $Action -in 'Test','Restore','Uninstall','Guard'){
 $installed=$null
 if($Action -in 'Restore','Uninstall'){
  $journalPath=Join-Path $StateRoot 'journal.json';Assert-SafePath $journalPath
  if(Test-Path -LiteralPath $journalPath){
   $history=Get-Content -LiteralPath $journalPath -Raw|ConvertFrom-Json
   if($history.schemaVersion -ne 1){throw 'Unsupported recovery journal'}
   $installed=@($history.transactions|Where-Object status -ne 'restored'|Select-Object -Last 1)
   if($installed.Count){$installed=$installed[0]}else{$installed=$null}
  }
 }
 if(-not $installed){
  if(-not(Test-Path -LiteralPath $current)){throw 'No installed release pointer or pending recovery transaction.'}
  Assert-SafePath $current
  $installed=Get-Content -LiteralPath $current -Raw|ConvertFrom-Json
 }
 $Revision=$installed.revision;$Mode=$installed.mode
}
if(-not $Revision -and $SourceRoot){$Revision=(& git -C $SourceRoot rev-parse HEAD).Trim();if($LASTEXITCODE){throw 'Cannot resolve source HEAD'}}
if($Revision -notmatch '^[0-9a-f]{40}$'){throw 'Supply -Revision with a full immutable commit SHA, or -Version with a published release tag.'}
$release=Join-Path $StateRoot "releases\$Revision"
# Plan stages only in the system temporary folder and removes its own staging.
$temporary=$Action -eq 'Plan'
if($temporary){$release=Join-Path ([IO.Path]::GetTempPath()) ('j3w1-plan-'+[guid]::NewGuid().ToString('N'))}
$bootstrapLock=$null
$bootstrapLockPath=Join-Path $StateRoot 'bootstrap.lock'
try{
 if(-not $temporary){
  [IO.Directory]::CreateDirectory($StateRoot)|Out-Null
  Assert-SafePath $bootstrapLockPath
  try{$bootstrapLock=[IO.File]::Open($bootstrapLockPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)}catch{throw 'Another lifecycle owns bootstrap.lock. Verify the recorded process has ended before removing a stale lock.'}
  $bytes=[Text.Encoding]::UTF8.GetBytes((@{pid=$PID;action=$Action}|ConvertTo-Json -Compress));$bootstrapLock.Write($bytes);$bootstrapLock.Flush($true)
 }
 Assert-SafePath $release
 if(-not(Test-Path -LiteralPath (Join-Path $release 'verified.json'))){
  if($Action -in 'Restore','Uninstall','Guard','Test' -and -not ($Action -in 'Restore','Uninstall' -and $explicitOfflineRecovery)){throw 'Installed release cache is unavailable; restore the saved cache before recovery, or supply an exact offline SourceRoot and Revision. No network fetch is performed.'}
  [IO.Directory]::CreateDirectory($release)|Out-Null
  Get-PinnedFile 'ports/windows/dist/install-manifest.json' (Join-Path $release 'install-manifest.json')
  $manifest=Get-Content -LiteralPath (Join-Path $release 'install-manifest.json') -Raw|ConvertFrom-Json
  Assert-ReleaseManifest $manifest
  foreach($entry in $manifest.files){
   $destination=Join-Path $release $entry.path
   Get-PinnedFile "ports/windows/$($entry.path)" $destination
   if((Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256){throw "Release digest mismatch: $($entry.path)"}
  }
  @{revision=$Revision;manifestSha256=(Get-FileHash -LiteralPath (Join-Path $release 'install-manifest.json') -Algorithm SHA256).Hash}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $release 'verified.json') -Encoding utf8
 }
 # Revalidate cached bytes on every invocation, including rollback/guard.
 Assert-SafePath (Join-Path $release 'verified.json')
 Assert-SafePath (Join-Path $release 'install-manifest.json')
 $verified=Get-Content -LiteralPath (Join-Path $release 'verified.json') -Raw|ConvertFrom-Json
 if($verified.revision -ne $Revision -or $verified.manifestSha256 -ne (Get-FileHash -LiteralPath (Join-Path $release 'install-manifest.json') -Algorithm SHA256).Hash){throw 'Cached release manifest changed'}
 $manifest=Get-Content -LiteralPath (Join-Path $release 'install-manifest.json') -Raw|ConvertFrom-Json
  Assert-ReleaseManifest $manifest
 foreach($entry in $manifest.files){$f=Join-Path $release $entry.path;Assert-SafePath $f;if((Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256){throw "Cached release changed: $($entry.path)"}}
 $deps=Get-Content -LiteralPath (Join-Path $release 'dependencies.json') -Raw|ConvertFrom-Json
 $node=Get-Command node -ErrorAction SilentlyContinue
 $ownedNode=Join-Path $StateRoot "tools/node/$($deps.node.version)/node.exe"
 Assert-SafePath $ownedNode
 if(-not $Fixture){
  # A process-injected tool cache may disappear and is absent from sign-in PATH.
  # Reuse a compatible ordinary installation; otherwise retain a pinned runtime.
  $ordinaryPath=@(([Environment]::GetEnvironmentVariable('Path','User') -split ';')+([Environment]::GetEnvironmentVariable('Path','Machine') -split ';'))
  $ordinaryNode=$false
  foreach($directory in $ordinaryPath){
   if($directory -and [IO.Path]::IsPathFullyQualified([Environment]::ExpandEnvironmentVariables($directory))){
    $candidate=Join-Path ([Environment]::ExpandEnvironmentVariables($directory)) 'node.exe'
    if(Test-Path -LiteralPath $candidate -PathType Leaf){
     $candidateVersion=& $candidate --version
     if($LASTEXITCODE -eq 0 -and $candidateVersion -match '^v(\d+)\.' -and [int]$Matches[1] -ge 24){
      $node=[pscustomobject]@{Source=$candidate};$ordinaryNode=$true;break
     }
    }
   }
  }
  if(-not $ordinaryNode -and $Action -in 'Prepare','Apply','Update'){
   [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($ownedNode))|Out-Null
   Get-VerifiedDownload $deps.node $ownedNode
   $signature=Get-AuthenticodeSignature -LiteralPath $ownedNode
   if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notlike "*$($deps.node.publisher)*"){throw 'Node runtime publisher verification failed'}
  }
  if(Test-Path -LiteralPath $ownedNode){
   if((Get-FileHash -LiteralPath $ownedNode -Algorithm SHA256).Hash.ToLowerInvariant() -ne $deps.node.sha256){throw 'Retained Node runtime digest mismatch'}
   $node=Get-Item -LiteralPath $ownedNode
   $node=[pscustomobject]@{Source=$node.FullName}
  }
 }
 if(-not $node){throw 'Node 24+ is required to inspect settings. Apply installs the pinned runtime when no compatible ordinary installation exists.'}
 if([int]((& $node.Source --version).TrimStart('v').Split('.')[0]) -lt 24){throw 'Node 24+ is required.'}
 $guardPowerShell=(Get-Process -Id $PID).Path
 # Keep Guard on the same unpackaged runtime as installation and recovery.
 if($FixtureFailAfter -and -not $Fixture){throw 'Failure injection is available only in isolated fixtures'}
 $request=@{guardPwsh=$guardPowerShell;failAfter=$FixtureFailAfter;source=$release;state=$StateRoot;action=$Action;mode=$Mode;revision=$Revision;latest=[bool]$Latest;pwsh=(Get-Process -Id $PID).Path;fixture=[bool]$Fixture}
 if($Action -in 'Apply','Update'){
  $preflight=$request.Clone();$preflight.action='Plan'
  $report=$preflight|ConvertTo-Json -Compress|& $node.Source (Join-Path $release 'dist/runtime.cjs')
  if($LASTEXITCODE){throw 'Preflight failed; no dependencies or settings were changed'}
  $plan=$report|ConvertFrom-Json
  if($Mode -eq 'Full' -and -not $plan.compatible){throw 'Full preflight failed: unsupported Windows/shell fingerprint'}
 }
 if($Action -in 'Apply','Update' -and -not $Fixture){
  $deps=Get-Content -LiteralPath (Join-Path $release 'dependencies.json') -Raw|ConvertFrom-Json
  $downloads=Join-Path $StateRoot 'downloads';Assert-SafePath $downloads;[IO.Directory]::CreateDirectory($downloads)|Out-Null
  Install-ThemeFont $deps.font $downloads
 }
 if($Action -in 'Apply','Update' -and $Mode -eq 'Full' -and -not $Fixture){
  $tool=Join-Path $StateRoot 'tools\windhawk\2.0.0-alpha.6';$cli=Join-Path $tool 'windhawk-cli.exe'
  if(-not(Test-Path -LiteralPath $cli)){
   $setup=Join-Path $downloads 'windhawk_setup_offline.exe';Get-VerifiedDownload $deps.windhawk $setup
   $sig=Get-AuthenticodeSignature -LiteralPath $setup
   if($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notlike "*$($deps.windhawk.publisher)*"){throw 'Windhawk publisher signature verification failed'}
   $proc=Start-Process -FilePath $setup -ArgumentList @('/S','/PORTABLE','/DEVTOOLS',"/D=$tool") -WindowStyle Hidden -Wait -PassThru
   if($proc.ExitCode -ne 0){throw "Windhawk dependency installation failed: $($proc.ExitCode)"}
  }
  if((& $cli --version) -ne 'windhawk-cli 2.0.0-alpha.6'){throw 'Windhawk version differs from the reviewed pin'}
  foreach($mod in $deps.mods){Get-VerifiedDownload $mod (Join-Path $downloads "$($mod.id).wh.cpp")}
 }
  if($Action -eq 'Prepare'){$request.action='Plan'}
  # Every apply path retains recovery before settings change, including a
  # source checkout and the internal lifecycle invoked by the bootstrap.
  if($Action -in 'Apply','Update'){
   Save-J3w1SetupRecovery $guardPowerShell (Join-Path $release 'install.ps1') $StateRoot
  }
  $request|ConvertTo-Json -Compress|& $node.Source (Join-Path $release 'dist\runtime.cjs')
 if($LASTEXITCODE -ne 0){throw "Lifecycle $Action failed with exit code $LASTEXITCODE. Recovery: install.ps1 -Action Restore"}
 if($Action -in 'Apply','Update'){
    Write-Output "Installed entry point: $release\install.ps1"
 }
 if($Action -in 'Restore','Uninstall'){Sync-J3w1SetupRecovery $guardPowerShell $StateRoot}
} finally {
 if($null -ne $bootstrapLock){$bootstrapLock.Dispose();Remove-Item -LiteralPath $bootstrapLockPath}
 if($temporary -and(Test-Path -LiteralPath $release)){
  $tempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
  $resolved=[IO.Path]::GetFullPath($release)
  if(-not $resolved.StartsWith($tempRoot,[StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($resolved) -notlike 'j3w1-plan-*'){throw 'Unsafe staging cleanup refused'}
  Remove-Item -LiteralPath $resolved -Recurse -Force
 }
}
}

if($MyInvocation.InvocationName -ne '.'){
 Set-StrictMode -Version Latest;$ErrorActionPreference='Stop'
 if($Latest -and $Action -ne 'Restore'){throw '-Latest is only valid with -Action Restore'}
 if($Action -eq 'Update' -and -not $Revision -and -not $Version){throw 'Update requires an explicit -Version or -Revision.'}
 if($Lifecycle -or $SourceRoot -or $Fixture -or $Action -in 'Plan','Prepare','Guard'){
  $lifecycleMode=if($Mode -eq 'Auto'){'Full'}else{$Mode}
  Invoke-J3w1WindowsLifecycle -Action $Action -Mode $lifecycleMode -Revision $Revision -Version $Version -SourceRoot $SourceRoot -StateRoot $StateRoot -Latest:$Latest -Fixture:$Fixture -FixtureFailAfter $FixtureFailAfter
  if(-not $Lifecycle -and -not $Fixture -and $Action -in 'Apply','Update'){
   Invoke-J3w1WindowsLifecycle -Action Test -StateRoot $StateRoot
  }
 }elseif($Action -in 'Apply','Update'){
  Invoke-J3w1WindowsSetup $Revision $Version $Mode ([bool]$NonInteractive) $StateRoot
 }else{
  if($Revision -or $Version){throw 'Recovery and Test use the installed revision automatically; omit -Revision and -Version.'}
  Invoke-J3w1WindowsRecovery $Action ([bool]$Latest) $StateRoot
 }
}
