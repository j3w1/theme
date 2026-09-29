<# j3w1 Windows lifecycle. Run with PowerShell 7.4+ and Node 24+.
   Sources are fetched from immutable Git objects or commit-pinned HTTPS URLs.
   Plan never installs dependencies or changes application settings. Prepare
   retains the verified release and Node, then reports the same compatibility plan. #>
[CmdletBinding()]
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
if(-not $IsWindows -and -not $Fixture){throw 'Run this installer on native Windows.'}
if($PSVersionTable.PSVersion -lt [version]'7.4'){throw 'PowerShell 7.4+ is required.'}
if(-not $Fixture -and (Get-Process -Id $PID).Path -match '\\WindowsApps\\'){throw 'Packaged PowerShell registry views are unsupported. Run setup.ps1 from Windows PowerShell to use a verified standalone runtime.'}
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
  if($entry.path -notmatch '^(dist/[a-z0-9][a-z0-9.-]*|install\.ps1|setup\.ps1|adapter\.ps1|lockscreen\.ps1|dependencies\.json|host\.json)$' -or $entry.path.Contains('..') -or $entry.sha256 -notmatch '^[0-9a-f]{64}$' -or -not $seen.Add($entry.path)){throw 'Unsafe, duplicate or malformed release manifest entry'}
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
  if($Action -in 'Restore','Uninstall','Guard','Test' -and -not ($Action -in 'Restore','Uninstall' -and $SourceRoot -and $PSBoundParameters.ContainsKey('Revision'))){throw 'Installed release cache is unavailable; restore the saved cache before recovery, or supply an exact offline SourceRoot and Revision. No network fetch is performed.'}
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
  $request|ConvertTo-Json -Compress|& $node.Source (Join-Path $release 'dist\runtime.cjs')
 if($LASTEXITCODE -ne 0){throw "Lifecycle $Action failed with exit code $LASTEXITCODE. Recovery: install.ps1 -Action Restore"}
 if($Action -in 'Apply','Update'){
    Write-Output "Installed entry point: $release\install.ps1"
 }
} finally {
 if($null -ne $bootstrapLock){$bootstrapLock.Dispose();Remove-Item -LiteralPath $bootstrapLockPath}
 if($temporary -and(Test-Path -LiteralPath $release)){
  $tempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
  $resolved=[IO.Path]::GetFullPath($release)
  if(-not $resolved.StartsWith($tempRoot,[StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($resolved) -notlike 'j3w1-plan-*'){throw 'Unsafe staging cleanup refused'}
  Remove-Item -LiteralPath $resolved -Recurse -Force
 }
}
