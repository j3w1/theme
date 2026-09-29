param([string]$Setup,[string]$Root,[string]$Case)
Set-StrictMode -Version Latest;$ErrorActionPreference='Stop'
. $Setup
function Check($Condition,[string]$Message){if(-not $Condition){throw $Message}}
function Reject([scriptblock]$Block,[string]$Pattern){try{& $Block}catch{if($_.Exception.Message -match $Pattern){return};throw};throw "Expected rejection: $Pattern"}
function WriteJson([string]$Path,$Value){[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($Path))|Out-Null;[IO.File]::WriteAllText($Path,($Value|ConvertTo-Json -Depth 10))}
$rev='a'*40
if($Case -eq 'identity'){
 Check ((Resolve-J3w1SetupRevision $rev '') -eq $rev) 'Full commit not preserved'
 Reject {Resolve-J3w1SetupRevision 'main' ''} 'immutable'
 Reject {Resolve-J3w1SetupRevision ('A'*40) ''} 'immutable'
 Reject {Resolve-J3w1SetupRevision $rev 'v4.0.0'} 'either'
 $script:urls=@()
 function Invoke-RestMethod($Uri){$script:urls+=$Uri;if($Uri -like '*/ref/tags/v4.0.0'){return @{object=@{type='tag';sha='b'*40;url='https://example.invalid/untrusted'}}};return @{object=@{type='commit';sha=$rev}}}
 Check ((Resolve-J3w1SetupRevision '' 'v4.0.0') -eq $rev) 'Annotated tag did not resolve'
 Check ($script:urls.Count -eq 2 -and $script:urls[1] -eq ('https://api.github.com/repos/j3w1/theme/git/tags/'+('b'*40))) 'Untrusted tag URL followed'
}
elseif($Case -eq 'modes'){
 Check ((Select-J3w1SetupMode @{compatible=$true} 'Auto' $true) -eq 'Full') 'Supported Auto should use Full'
 Check ((Select-J3w1SetupMode @{compatible=$false} 'Native' $true) -eq 'Native') 'Explicit Native refused'
 Reject {Select-J3w1SetupMode @{compatible=$false} 'Full' $false} 'unavailable'
 Reject {Select-J3w1SetupMode @{compatible=$false} 'Auto' $true} 'unavailable'
 Reject {Select-J3w1SetupMode @{compatible='true'} 'Auto' $true} 'Invalid compatibility'
 function Read-Host {return ''};Reject {Select-J3w1SetupMode @{compatible=$false} 'Auto' $false} 'cancelled'
 function Read-Host {return 'N'};Check ((Select-J3w1SetupMode @{compatible=$false} 'Auto' $false) -eq 'Native') 'Explicit fallback failed'
}
elseif($Case -eq 'download'){
 [IO.Directory]::CreateDirectory($Root)|Out-Null;$good=Join-Path $Root 'good';[IO.File]::WriteAllText($good,'verified')
 $hash=(Get-FileHash -LiteralPath $good).Hash
 function Invoke-WebRequest {throw 'NETWORK MUST NOT RUN'}
 Get-J3w1SetupFile 'https://example.invalid/' $good $hash
 Reject {Get-J3w1SetupFile 'https://example.invalid/' $good ('0'*64)} 'differs'
 Reject {Get-J3w1SetupFile 'https://example.invalid/' (Join-Path $Root 'missing') $hash -Offline} 'no download'
 $beforeProgress=$ProgressPreference
 function Invoke-WebRequest($Uri,$OutFile){Check ($ProgressPreference -eq 'SilentlyContinue') 'Download progress was not scoped off';[IO.File]::WriteAllText($OutFile,'corrupt')}
 $destination=Join-Path $Root 'bad';Reject {Get-J3w1SetupFile 'https://example.invalid/' $destination $hash} 'digest mismatch'
 Check (-not(Test-Path -LiteralPath $destination)) 'Corrupt download published'
 Check ($ProgressPreference -eq $beforeProgress) 'Caller progress preference changed'
 Check (@(Get-ChildItem -LiteralPath $Root -Filter '*.download-*').Count -eq 0) 'Partial download left behind'
}
elseif($Case -eq 'recovery'){
 $env:OS='Windows_NT';$release=Join-Path $Root "releases/$rev";[IO.Directory]::CreateDirectory($release)|Out-Null
 [IO.File]::WriteAllText((Join-Path $release 'install.ps1'),'# verified fixture')
 WriteJson (Join-Path $release 'dependencies.json') @{}
 $files=@('install.ps1','dependencies.json')|ForEach-Object {@{path=$_;sha256=(Get-FileHash (Join-Path $release $_)).Hash.ToLowerInvariant()}}
 $manifest=Join-Path $release 'install-manifest.json';WriteJson $manifest @{schemaVersion=1;files=$files}
 WriteJson (Join-Path $release 'verified.json') @{revision=$rev;manifestSha256=(Get-FileHash $manifest).Hash}
 WriteJson (Join-Path $Root 'journal.json') @{schemaVersion=1;transactions=@(@{revision=$rev;mode='Full';status='applying'})}
 function Find-J3w1SetupPowerShell {return 'fixture-pwsh'}
 function Invoke-RestMethod {throw 'RECOVERY MUST STAY OFFLINE'}
 function Invoke-WebRequest {throw 'RECOVERY MUST STAY OFFLINE'}
 function Invoke-J3w1SetupLifecycle($PowerShell,$Installer,$Action,$Mode,$Revision,$StateRoot,[switch]$Latest){$script:called=@($Action,$Mode,$Revision,[bool]$Latest)}
 Invoke-J3w1WindowsRecovery 'Restore' $true $Root
 Check ($script:called[0] -eq 'Restore' -and $script:called[1] -eq 'Full' -and $script:called[2] -eq '' -and $script:called[3]) 'Pending first apply recovery routing failed'
 [IO.File]::AppendAllText((Join-Path $release 'install.ps1'),'# altered')
 Reject {Invoke-J3w1WindowsRecovery 'Restore' $false $Root} 'missing or changed'
}
elseif($Case -eq 'orchestration'){
 $env:OS='Windows_NT';$env:PROCESSOR_ARCHITECTURE='AMD64'
 function Get-ItemPropertyValue {return 26200}
 function Find-J3w1SetupPowerShell {return 'fixture-pwsh'}
 $script:scriptBytes='# fixture installer';$script:depsBytes='{}';$sha=[Security.Cryptography.SHA256]::Create()
 try{$script:scriptHash=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($script:scriptBytes)))).Replace('-','').ToLowerInvariant();$script:depsHash=([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($script:depsBytes)))).Replace('-','').ToLowerInvariant()}finally{$sha.Dispose()}
 function Invoke-WebRequest($Uri,$OutFile){
  if($Uri.EndsWith('/dist/install-manifest.json')){WriteJson $OutFile @{schemaVersion=1;files=@(@{path='install.ps1';sha256=$script:scriptHash},@{path='dependencies.json';sha256=$script:depsHash})}}
  elseif($Uri.EndsWith('/install.ps1')){[IO.File]::WriteAllText($OutFile,$script:scriptBytes)}
  elseif($Uri.EndsWith('/dependencies.json')){[IO.File]::WriteAllText($OutFile,$script:depsBytes)}
  else{throw 'Unexpected download'}
 }
 $script:actions=@();$script:compatible=$true;$script:failTest=$true
 function Invoke-J3w1SetupLifecycle($PowerShell,$Installer,$Action,$Mode,$Revision,$StateRoot){
  $script:actions+=@("${Action}:$Mode")
  if($Action -eq 'Prepare'){return (@{compatible=$script:compatible}|ConvertTo-Json -Compress)}
  if($Action -eq 'Test' -and $script:failTest){throw 'injected verification failure'}
 }
 Reject {Invoke-J3w1WindowsSetup $rev '' 'Auto' $true $Root} 'injected verification failure'
 Check (($script:actions -join ',') -eq 'Prepare:Full,Apply:Full,Test:Full') 'Setup does not sequence Prepare/Apply/Test'
 Check (Test-Path -LiteralPath (Join-Path $Root 'recovery-commands.txt')) 'Recovery commands not retained before Apply'
 Check (-not(Test-Path -LiteralPath (Join-Path $Root 'setup.lock'))) 'Setup lock leaked'
 $script:actions=@();$script:compatible=$false
 Reject {Invoke-J3w1WindowsSetup $rev '' 'Auto' $true $Root} 'unavailable'
 Check (($script:actions -join ',') -eq 'Prepare:Full') 'Unsupported host applied settings'
 $script:actions=@();$script:failTest=$false
 Invoke-J3w1WindowsSetup $rev '' 'Native' $true $Root
 Check (($script:actions -join ',') -eq 'Prepare:Full,Apply:Native,Test:Native') 'Explicit Native routing failed'
}
elseif($Case -eq 'child-failure'){
 [IO.Directory]::CreateDirectory($Root)|Out-Null;$bad=Join-Path $Root 'failure.ps1';[IO.File]::WriteAllText($bad,'param($Action,$Mode,$StateRoot) exit 23')
 Reject {Invoke-J3w1SetupLifecycle (Get-Process -Id $PID).Path $bad 'Restore' 'Native' '' $Root} 'exit 23'
 $commands=Get-J3w1SetupRecovery "C:\test's runtime\pwsh.exe" "C:\some folder\setup.ps1" "C:\user's theme"
 Check ($commands.Count -eq 4 -and $commands[1].EndsWith('-Action Restore -Latest')) 'Recovery actions missing'
 foreach($line in $commands){$tokens=$null;$errors=$null;[void][Management.Automation.Language.Parser]::ParseInput($line,[ref]$tokens,[ref]$errors);Check ($errors.Count -eq 0) 'Recovery command is not valid PowerShell'}
}
else{throw "Unknown fixture $Case"}
Write-Output "PASS $Case"
