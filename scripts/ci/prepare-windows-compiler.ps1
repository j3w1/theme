<# CI-only portable compiler preparation. Does not apply a theme or start the
   Windhawk engine. Dependency identity comes from the Windows installer pin. #>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$Root)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if(-not $IsWindows){throw 'The native compiler gate requires Windows.'}
if(-not $env:RUNNER_TEMP){throw 'This dependency preparation is limited to a CI runner.'}
$Root=[IO.Path]::GetFullPath($Root)
$runner=[IO.Path]::GetFullPath($env:RUNNER_TEMP).TrimEnd('\','/')+[IO.Path]::DirectorySeparatorChar
if(-not $Root.StartsWith($runner,[StringComparison]::OrdinalIgnoreCase)){throw 'Compiler root must be inside the CI temporary folder.'}
function Assert-CompilerPath([string]$Path){
 $p=[IO.Path]::GetFullPath($Path)
 while($p){
  if(Test-Path -LiteralPath $p){if((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse compiler path refused.'}}
  $parent=[IO.Path]::GetDirectoryName($p);if($parent -eq $p){break};$p=$parent
 }
}
Assert-CompilerPath $Root
$pin=(Get-Content -LiteralPath (Join-Path $PSScriptRoot '../../ports/windows/dependencies.json') -Raw|ConvertFrom-Json).windhawk
if($pin.version -cne '2.0.0-alpha.6' -or $pin.sha256 -cnotmatch '^[a-f0-9]{64}$' -or $pin.url -cne "https://github.com/ramensoftware/windhawk/releases/download/$($pin.version)/windhawk_setup_offline.exe"){throw 'Invalid compiler dependency pin.'}
$archive=Join-Path $env:RUNNER_TEMP 'j3w1-native-compiler-setup.exe'
Assert-CompilerPath $archive
if(-not(Test-Path -LiteralPath $archive)){
 $pending=$archive+'.download-'+[guid]::NewGuid().ToString('N')
 try{
  $ProgressPreference='SilentlyContinue'
  Invoke-WebRequest -Uri $pin.url -OutFile $pending -TimeoutSec 300 -OperationTimeoutSeconds 60
  if((Get-FileHash -LiteralPath $pending -Algorithm SHA256).Hash.ToLowerInvariant() -cne $pin.sha256){throw 'Compiler archive digest mismatch.'}
  [IO.File]::Move($pending,$archive)
 }finally{if(Test-Path -LiteralPath $pending){Remove-Item -LiteralPath $pending}}
}
if((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -cne $pin.sha256){throw 'Cached compiler archive digest mismatch.'}
$sig=Get-AuthenticodeSignature -LiteralPath $archive
if($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notlike "*$($pin.publisher)*"){throw 'Compiler publisher signature verification failed.'}
if(Test-Path -LiteralPath $Root){throw 'Use an empty CI compiler destination.'}
$proc=Start-Process -FilePath $archive -ArgumentList @('/S','/PORTABLE','/DEVTOOLS',"/D=$Root") -WindowStyle Hidden -Wait -PassThru
if($proc.ExitCode -ne 0){throw "Portable compiler preparation failed: $($proc.ExitCode)"}
Assert-CompilerPath $Root
if((& (Join-Path $Root 'windhawk-cli.exe') --version) -ne 'windhawk-cli 2.0.0-alpha.6'){throw 'Compiler version differs from the reviewed pin.'}
