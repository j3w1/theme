param([string]$Installer,[string]$Root)
$ErrorActionPreference='Stop'
$Fixture=$true;$FixtureFailAfter=1;$StateRoot=Join-Path $Root 'state'
New-Item -ItemType Directory -Force $StateRoot|Out-Null
$tokens=$null;$errors=$null
$ast=[Management.Automation.Language.Parser]::ParseFile($Installer,[ref]$tokens,[ref]$errors)
if($errors.Count){throw ($errors|Out-String)}
$names=@('Assert-SafePath','Get-VerifiedDownload','Test-ThemeFont','Install-ThemeFont','Write-PrivateJson')
foreach($fn in $ast.FindAll({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst]},$true)){
 if($fn.Name -in $names){. ([scriptblock]::Create($fn.Extent.Text))}
}
$downloads=Join-Path $Root 'downloads';New-Item -ItemType Directory $downloads|Out-Null
$archive=Join-Path $downloads 'SourceCodePro.zip'
$zip=[IO.Compression.ZipFile]::Open($archive,[IO.Compression.ZipArchiveMode]::Create)
try{foreach($name in @('Regular','Bold','Italic','BoldItalic')){$entry=$zip.CreateEntry("$name.ttf");$stream=$entry.Open();try{$bytes=[Text.Encoding]::UTF8.GetBytes("fixture $name");$stream.Write($bytes)}finally{$stream.Dispose()}}}finally{$zip.Dispose()}
$font=[pscustomobject]@{version='fixture';sha256=(Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant();url='https://example.invalid/unavailable';files=[pscustomobject]@{'Regular.ttf'='Regular';'Bold.ttf'='Bold';'Italic.ttf'='Italic';'BoldItalic.ttf'='BoldItalic'}}
$failed=$false;try{Install-ThemeFont $font $downloads}catch{if($_ -notmatch 'Injected font interruption'){throw};$failed=$true}
if(-not $failed){throw 'Failure injection did not run'}
$receipt=Join-Path $StateRoot 'font-dependency.json'
if((Get-Content $receipt -Raw|ConvertFrom-Json).status -ne 'installing'){throw 'Missing durable pending receipt'}
$FixtureFailAfter=0;Install-ThemeFont $font $downloads
$done=Get-Content $receipt -Raw|ConvertFrom-Json
if($done.status -ne 'installed' -or $done.owned.Count -ne 4){throw 'Incomplete font recovery'}
$before=[IO.File]::ReadAllText($receipt);Install-ThemeFont $font $downloads
if([IO.File]::ReadAllText($receipt) -cne $before){throw 'Repeated install was not idempotent'}
# Never reach the real network, even on a failed-download path.
function Invoke-WebRequest {throw 'fixture network unavailable'}
$missing=Join-Path $downloads 'missing.zip';$failed=$false
try{Get-VerifiedDownload $font $missing}catch{if($_ -notmatch 'fixture network unavailable'){throw};$failed=$true}
if(-not $failed -or (Test-Path $missing) -or @(Get-ChildItem $downloads -Filter '*.download-*').Count){throw 'Failed download left a committed artifact'}
[IO.File]::AppendAllText($archive,'corrupt');$failed=$false
try{Get-VerifiedDownload $font $archive}catch{if($_ -notmatch 'digest mismatch'){throw};$failed=$true}
if(-not $failed){throw 'Corrupt cached dependency was accepted'}
Write-Output 'Font interruption/recovery, idempotency, unavailable network and corrupt dependency checks passed.'
