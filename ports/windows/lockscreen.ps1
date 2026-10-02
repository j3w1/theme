# Windows PowerShell 5.1 bridge for the supported WinRT LockScreen API.
# Image bytes are returned only to the private lifecycle journal, never to logs.
$ErrorActionPreference='Stop'
$request=[Console]::In.ReadToEnd()|ConvertFrom-Json
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.System.UserProfile.LockScreen,Windows.System.UserProfile,ContentType=WindowsRuntime]
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
function Await-Result($Operation,[Type]$Type){
 $method=[System.WindowsRuntimeSystemExtensions].GetMethods()|Where-Object {$_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetGenericArguments().Count -eq 1}|Select-Object -First 1
 $task=$method.MakeGenericMethod($Type).Invoke($null,@($Operation))
 return $task.GetAwaiter().GetResult()
}
switch($request.operation){
 'get' {
  $uri=[Windows.System.UserProfile.LockScreen]::OriginalImageFile
  if(-not $uri -or -not $uri.IsFile -or -not(Test-Path -LiteralPath $uri.LocalPath -PathType Leaf)){@{exists=$false;reason='Previous image is not a recoverable file'}|ConvertTo-Json -Compress;exit}
  $file=Get-Item -LiteralPath $uri.LocalPath
  if($file.Length -gt 20MB -or $file.Extension.ToLowerInvariant() -notin '.jpg','.jpeg','.png','.bmp'){@{exists=$false;reason='Previous image is outside supported backup bounds'}|ConvertTo-Json -Compress;exit}
  @{exists=$true;value=[Convert]::ToBase64String([IO.File]::ReadAllBytes($file.FullName));extension=$file.Extension.ToLowerInvariant()}|ConvertTo-Json -Compress
 }
 'set' {
  $file=Await-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync($request.path)) ([Windows.Storage.StorageFile])
  $operation=[Windows.System.UserProfile.LockScreen]::SetImageFileAsync($file)
  $method=[System.WindowsRuntimeSystemExtensions].GetMethods()|Where-Object {$_.Name -eq 'AsTask' -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.FullName -eq 'Windows.Foundation.IAsyncAction'}|Select-Object -First 1
  $task=$method.Invoke($null,@($operation))
  $null=$task.GetAwaiter().GetResult()
  @{ok=$true}|ConvertTo-Json -Compress
 }
 default {throw 'Unknown lock-screen operation'}
}
