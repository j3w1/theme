<# Windows PowerShell 5.1-compatible entry point. Theme mutations and recovery
   belong exclusively to install.ps1 at the selected immutable revision. #>
[CmdletBinding()]
param(
 [ValidateSet('Apply','Test','Restore','Uninstall')][string]$Action='Apply',
 [string]$Revision, [string]$Version,
 [ValidateSet('Auto','Full','Native')][string]$Mode='Auto',
 [switch]$NonInteractive,
 [switch]$Latest,
 [string]$StateRoot=(Join-Path $env:LOCALAPPDATA 'j3w1-theme\windows')
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
  $recovery=Get-J3w1SetupRecovery $powerShell (Join-Path $StateRoot "releases\$Revision\setup.ps1") $StateRoot
  Write-Host "Recovery commands (also saved in $StateRoot\recovery-commands.txt):"
  $recovery|ForEach-Object {Write-Host $_}
  $recoveryFile=Join-Path $StateRoot 'recovery-commands.txt';Assert-J3w1SetupPath $recoveryFile
  [IO.File]::WriteAllLines($recoveryFile,$recovery)
  Write-Host "Installing $chosen mode. PowerToys and Terminal are optional; existing installations are themed where supported."
  Invoke-J3w1SetupLifecycle $powerShell $installer 'Apply' $chosen $Revision $StateRoot|Write-Output
  Invoke-J3w1SetupLifecycle $powerShell $retained 'Test' $chosen $Revision $StateRoot|Write-Output
  Write-Host "j3w1 $chosen installation and settings verification passed. Reopen affected apps and inspect the appearance."
 } finally {
  $lock.Dispose();Remove-Item -LiteralPath $lockPath
  # Retain the small verified setup inputs for diagnosis; never remove user files.
 }
}
if($MyInvocation.InvocationName -ne '.'){
 Set-StrictMode -Version Latest;$ErrorActionPreference='Stop'
 if($Latest -and $Action -ne 'Restore'){throw '-Latest is only valid with -Action Restore'}
 if($Action -eq 'Apply'){Invoke-J3w1WindowsSetup $Revision $Version $Mode ([bool]$NonInteractive) $StateRoot}
 else {
  if($Revision -or $Version){throw 'Recovery and Test use the installed revision automatically; omit -Revision and -Version.'}
  Invoke-J3w1WindowsRecovery $Action ([bool]$Latest) $StateRoot
 }
}
