# Native Windows adapter: narrow current-user registry operations and documented
# personalization refresh. No UI automation, process termination or privilege change.
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
function ConvertFrom-RegistryDword([int]$Value){
  return [BitConverter]::ToUInt32([BitConverter]::GetBytes($Value),0)
}
$request=[Console]::In.ReadToEnd() | ConvertFrom-Json -AsHashtable
switch($request.operation) {
  'environment' {
    $os=Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
    function FileVersion([string]$Relative){
      $file=Join-Path $env:windir $Relative
      if(Test-Path -LiteralPath $file){return (Get-Item -LiteralPath $file).VersionInfo.FileVersion.Split(' ')[0]}
      return ''
    }
    function FixedFileVersion([string]$Relative){
      $file=Join-Path $env:windir $Relative
      if(Test-Path -LiteralPath $file){$v=(Get-Item -LiteralPath $file).VersionInfo;return "$($v.FileMajorPart).$($v.FileMinorPart).$($v.FileBuildPart).$($v.FilePrivatePart)"}
      return ''
    }
    function PackageVersion([string]$Name){
      $file=Join-Path $env:windir "SystemApps/$Name/AppxManifest.xml"
      if(Test-Path -LiteralPath $file){return ([xml](Get-Content -LiteralPath $file -Raw)).Package.Identity.Version}
      return ''
    }
    # Read the same three layout inputs as pinned Start Menu Styler 1.7.
    # Never set a feature flag. Unknown/default/query failure stays unknown.
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class J3w1StartLayoutProbe {
 [StructLayout(LayoutKind.Sequential, Pack=1)] public struct Configuration { public uint Id; public uint Bits; public uint Payload; }
 [DllImport("ntdll.dll")] static extern int RtlQueryFeatureConfiguration(uint id, int type, out long stamp, out Configuration config);
 public static int State(uint id) { long stamp; Configuration config; try { int status=RtlQueryFeatureConfiguration(id,1,out stamp,out config); return status<0 ? -1 : (int)((config.Bits>>4)&3); } catch { return -1; } }
}
'@
    $features=@(47205210,49221331,49402389)|ForEach-Object {[J3w1StartLayoutProbe]::State($_)}
    $layout=if(@($features|Where-Object {$_ -notin 1,2}).Count){'unknown'}elseif($features -contains 1){'classic'}else{'redesigned'}
    @{
      build=[int]$os.CurrentBuild;ubr=[int]$os.UBR;architecture=[Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
      explorerVersion=FileVersion 'explorer.exe'
      explorerFixedVersion=FixedFileVersion 'explorer.exe'
      startDockedVersion=FileVersion 'SystemApps/Microsoft.Windows.StartMenuExperienceHost_cw5n1h2txyewy/StartDocked.dll'
      settingsVersion=FileVersion 'ImmersiveControlPanel/SystemSettings.exe'
      shellExperienceVersion=FileVersion 'SystemApps/ShellExperienceHost_cw5n1h2txyewy/ShellExperienceHost.exe'
      searchVersion=FileVersion 'SystemApps/MicrosoftWindows.Client.CBS_cw5n1h2txyewy/SearchHost.exe'
      startPackageVersion=PackageVersion 'Microsoft.Windows.StartMenuExperienceHost_cw5n1h2txyewy'
      shellPackageVersion=PackageVersion 'ShellExperienceHost_cw5n1h2txyewy'
      clientPackageVersion=PackageVersion 'MicrosoftWindows.Client.CBS_cw5n1h2txyewy'
      startLayout=$layout
    } | ConvertTo-Json -Compress
  }
  {$_ -in 'get','set'} {
    $folderDefault=($request.key -in 'Software\Classes\Folder\DefaultIcon','Software\Classes\Directory\DefaultIcon') -and $request.name -ceq ''
    $folderShell=$request.key -ceq 'Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Icons' -and $request.name -in '3','4'
    if(-not $folderDefault -and -not $folderShell -and $request.key -notmatch '^(Software\\Microsoft\\Windows\\(DWM|CurrentVersion\\(Themes\\Personalize|Explorer\\Accent|Run))|Control Panel\\(Desktop|Cursors|Colors))$'){throw 'Registry target outside the Windows visual adapter scope'}
    $key=[Microsoft.Win32.Registry]::CurrentUser.OpenSubKey($request.key,$request.operation -eq 'set')
    try {
      if($request.operation -eq 'get') {
        if($null -eq $key -or $request.name -notin $key.GetValueNames()){@{exists=$false}|ConvertTo-Json -Compress}
        else{$kind=$key.GetValueKind($request.name).ToString();$value=$key.GetValue($request.name,$null,[Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames);if($kind -eq 'DWord'){$value=ConvertFrom-RegistryDword $value};@{exists=$true;type=$kind;value=$value}|ConvertTo-Json -Compress -Depth 10}
      } else {
        if($request.value.exists){if($null -eq $key){$key=[Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($request.key)};$value=$request.value.value;if($request.value.type -eq 'DWord'){$value=[BitConverter]::ToInt32([BitConverter]::GetBytes([uint32]$value),0)};$key.SetValue($request.name,$value,[Microsoft.Win32.RegistryValueKind]$request.value.type)}
        elseif($null -ne $key){$key.DeleteValue($request.name,$false)}
        @{ok=$true}|ConvertTo-Json -Compress
      }
    } finally {if($null -ne $key){$key.Dispose()}}
  }
  'startupShortcut' {
    # Serialize a native link in private staging. The lifecycle alone writes
    # the Startup file, atomically and with an original-state receipt.
    function Assert-ShortcutPath([string]$Path){
      if(-not [IO.Path]::IsPathFullyQualified($Path) -or $Path -match '[\r\n\x00"]'){throw 'Invalid startup shortcut path'}
      $full=[IO.Path]::GetFullPath($Path)
      for($cursor=$full;$cursor;){
        if(Test-Path -LiteralPath $cursor){
          if((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Startup shortcut reparse path refused'}
        }
        $parent=[IO.Path]::GetDirectoryName($cursor)
        if($parent -eq $cursor){break};$cursor=$parent
      }
      return $full
    }
    $target=Assert-ShortcutPath ([string]$request.target)
    $working=Assert-ShortcutPath ([string]$request.workingDirectory)
    if([IO.Path]::GetFileName($target) -cnotin 'pwsh.exe','powershell.exe' -or -not [IO.File]::Exists($target) -or -not [IO.Directory]::Exists($working)){throw 'Startup guard executable or source unavailable'}
    $arguments=[string]$request.arguments
    if($arguments.Length -gt 4096 -or $arguments -match '[\r\n\x00]' -or -not $arguments.StartsWith('-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -File ') -or $arguments -notmatch ' -Action Guard -StateRoot '){throw 'Invalid startup guard arguments'}
    $startup=[Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)
    if(-not $startup){throw 'Current-user Startup folder unavailable'}
    $destination=Assert-ShortcutPath (Join-Path $startup 'j3w1-theme-guard.lnk')
    $shell=New-Object -ComObject WScript.Shell
    $description='j3w1 theme compatibility guard'
    # Only reuse exact journal-owned bytes. Visible fields alone omit hidden
    # shell-link flags such as RunAsUser; a user edit must reach conflict checks.
    $trusted=if($request.PSObject.Properties['expectedShortcut']){$request.expectedShortcut}else{$null}
    if($null -ne $trusted -and [StringComparer]::OrdinalIgnoreCase.Equals([string]$trusted.path,$destination) -and [IO.File]::Exists($destination) -and (Get-Item -LiteralPath $destination).Length -le 131072){
      $bytes=[IO.File]::ReadAllBytes($destination)
      $value=[Convert]::ToBase64String($bytes)
      if($value -ceq [string]$trusted.value -and $bytes.Length -ge 76 -and ([BitConverter]::ToUInt32($bytes,20) -band 0x2000) -eq 0){
        $existing=$null
        try {
          $existing=$shell.CreateShortcut($destination)
          $matches=[StringComparer]::OrdinalIgnoreCase.Equals($existing.TargetPath,$target) -and $existing.Arguments -ceq $arguments -and [StringComparer]::OrdinalIgnoreCase.Equals($existing.WorkingDirectory,$working) -and $existing.WindowStyle -eq 7 -and $existing.Description -ceq $description
        } catch { $matches=$false } finally { if($null -ne $existing){[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($existing)} }
        if($matches){
          [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($shell)
          @{path=$destination;value=$value}|ConvertTo-Json -Compress
          break
        }
      }
    }
    $temporaryRoot=Assert-ShortcutPath ([IO.Path]::GetTempPath())
    $stage=Join-Path $temporaryRoot ('j3w1-startup-link-'+[guid]::NewGuid().ToString('N'))
    if(Test-Path -LiteralPath $stage){throw 'Startup shortcut staging collision'}
    [void][IO.Directory]::CreateDirectory($stage)
    $stage=Assert-ShortcutPath $stage
    $temporary=Join-Path $stage 'guard.lnk'
    $shortcut=$null
    try {
      $shortcut=$shell.CreateShortcut($temporary)
      $shortcut.TargetPath=$target;$shortcut.Arguments=$arguments
      $shortcut.WorkingDirectory=$working;$shortcut.WindowStyle=7;$shortcut.Description=$description
      $shortcut.Save()
      [void](Assert-ShortcutPath $temporary)
      if((Get-Item -LiteralPath $temporary).Length -gt 131072){throw 'Startup shortcut exceeds bounded size'}
      $bytes=[IO.File]::ReadAllBytes($temporary)
      if($bytes.Length -lt 76 -or ([BitConverter]::ToUInt32($bytes,20) -band 0x2000) -ne 0){throw 'Startup shortcut unexpectedly requests a different user'}
      @{path=$destination;value=[Convert]::ToBase64String($bytes)}|ConvertTo-Json -Compress
    } finally {
      if($null -ne $shortcut){[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($shortcut)}
      [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($shell)
      # Remove only the two exact owned staging paths; never recursive cleanup.
      $checked=Assert-ShortcutPath $stage
      if(-not $checked.StartsWith($temporaryRoot.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($checked) -notmatch '^j3w1-startup-link-[0-9a-f]{32}$'){throw 'Unsafe startup shortcut cleanup refused'}
      if([IO.File]::Exists($temporary)){[void](Assert-ShortcutPath $temporary);[IO.File]::Delete($temporary)}
      [IO.Directory]::Delete($checked,$false)
    }
  }
  'engine' {
    $expected=[IO.Path]::GetFullPath($request.path)
    if([IO.Path]::GetFileName($expected) -cne 'windhawk.exe' -or $expected -match '[\r\n]'){throw 'Invalid theme engine path'}
    $waitMs=[int]$request.waitMs
    if($waitMs -lt 0 -or $waitMs -gt 15000){throw 'Invalid engine wait limit'}
    $deadline=[DateTime]::UtcNow.AddMilliseconds($waitMs)
    do {
      $running=@(Get-Process -Name windhawk -ErrorAction SilentlyContinue | Where-Object { [StringComparer]::OrdinalIgnoreCase.Equals($_.Path,$expected) }).Count -gt 0
      if($running -or [DateTime]::UtcNow -ge $deadline){break}
      Start-Sleep -Milliseconds 100
    } while($true)
    @{running=$running}|ConvertTo-Json -Compress
  }
  'refresh' {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class J3w1Personalization {
 [DllImport("shell32.dll")] public static extern void SHChangeNotify(uint kind,uint flags,IntPtr first,IntPtr second);
 [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)] public static extern bool SystemParametersInfo(uint action,uint param,string value,uint flags);
 [DllImport("user32.dll",EntryPoint="SystemParametersInfoW",SetLastError=true)] public static extern bool ReloadPointers(uint action,uint param,IntPtr value,uint flags);
 [DllImport("user32.dll",CharSet=CharSet.Unicode,SetLastError=true)] public static extern IntPtr SendMessageTimeout(IntPtr window,uint msg,UIntPtr wParam,string lParam,uint flags,uint timeout,out UIntPtr result);
}
'@
    $wallpaper=(Get-ItemProperty 'HKCU:\Control Panel\Desktop').Wallpaper
    if(-not [J3w1Personalization]::SystemParametersInfo(20,0,$wallpaper,3)){throw 'Wallpaper refresh failed'}
    if(-not [J3w1Personalization]::ReloadPointers(87,0,[IntPtr]::Zero,0)){throw ('Cursor refresh failed: Win32 '+[Runtime.InteropServices.Marshal]::GetLastWin32Error())}
    $result=[UIntPtr]::Zero
    [void][J3w1Personalization]::SendMessageTimeout([IntPtr]0xffff,0x1a,[UIntPtr]::Zero,'ImmersiveColorSet',2,2000,[ref]$result)
    [J3w1Personalization]::SHChangeNotify(0x08000000,0x2000,[IntPtr]::Zero,[IntPtr]::Zero)
    @{ok=$true}|ConvertTo-Json -Compress
  }
  default {throw 'Unknown Windows adapter operation'}
}
