param([Parameter(Mandatory)][string]$VaultPath)

$ErrorActionPreference = 'Stop'
$vault = (Resolve-Path -LiteralPath $VaultPath -ErrorAction Stop).ProviderPath
$config = Join-Path $vault '.obsidian'
if (-not (Test-Path -LiteralPath $config -PathType Container)) {
    throw "Not an existing Obsidian vault configuration: $config"
}

$themes = Join-Path $config 'themes'
$theme = Join-Path $themes 'j3w1'
$download = Join-Path ([System.IO.Path]::GetTempPath()) ("j3w1-download-" + [guid]::NewGuid().ToString('N'))
$staging = $null
$keepBackup = $false
$createdTheme = $false
$names = @('manifest.json', 'theme.css')

try {
    New-Item -ItemType Directory -Path $download -ErrorAction Stop | Out-Null
    $base = 'https://j3w1.github.io/theme/ports/obsidian/'
    foreach ($name in $names) {
        Invoke-WebRequest -Uri ($base + $name) -OutFile (Join-Path $download $name) -UseBasicParsing -ErrorAction Stop
    }

    $manifest = Get-Content -LiteralPath (Join-Path $download 'manifest.json') -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
    if ($manifest.name -cne 'j3w1' -or $manifest.version -notmatch '^\d+\.\d+\.\d+$' -or
        $manifest.minAppVersion -notmatch '^\d+\.\d+\.\d+$') {
        throw 'Downloaded manifest has an unexpected name or invalid version/minAppVersion.'
    }
    $css = Join-Path $download 'theme.css'
    if ((Get-Item -LiteralPath $css -ErrorAction Stop).Length -eq 0) { throw 'Downloaded CSS is empty.' }
    $header = Get-Content -LiteralPath $css -TotalCount 1 -ErrorAction Stop
    $expected = "/* j3w1 theme $($manifest.version), default profile, for Obsidian."
    if ($header -cne $expected) { throw 'Downloaded CSS header does not match the manifest version.' }

    if (-not (Test-Path -LiteralPath $themes -PathType Container)) {
        New-Item -ItemType Directory -Path $themes -ErrorAction Stop | Out-Null
    }
    $staging = Join-Path $themes (".j3w1-install-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $staging -ErrorAction Stop | Out-Null
    foreach ($name in $names) {
        Copy-Item -LiteralPath (Join-Path $download $name) -Destination (Join-Path $staging $name) -ErrorAction Stop
    }

    if (Test-Path -LiteralPath $theme) {
        if (-not (Test-Path -LiteralPath $theme -PathType Container)) { throw "Theme path is not a directory: $theme" }
        $existing = @($names | Where-Object { Test-Path -LiteralPath (Join-Path $theme $_) })
        if ($existing.Count -eq 1) { throw 'Existing theme has only one of the two files; repair it before updating.' }
        foreach ($name in $existing) {
            if (-not (Test-Path -LiteralPath (Join-Path $theme $name) -PathType Leaf)) { throw "Theme artifact is not a file: $name" }
            Copy-Item -LiteralPath (Join-Path $theme $name) -Destination (Join-Path $staging ("old-" + $name)) -ErrorAction Stop
        }
    } else {
        New-Item -ItemType Directory -Path $theme -ErrorAction Stop | Out-Null
        $createdTheme = $true
    }

    try {
        foreach ($name in $names) {
            Copy-Item -LiteralPath (Join-Path $staging $name) -Destination (Join-Path $theme $name) -Force -ErrorAction Stop
        }
    } catch {
        $replacementError = $_
        try {
            foreach ($name in $names) {
                $target = Join-Path $theme $name
                $backup = Join-Path $staging ("old-" + $name)
                if (Test-Path -LiteralPath $backup -PathType Leaf) {
                    Copy-Item -LiteralPath $backup -Destination $target -Force -ErrorAction Stop
                } elseif (Test-Path -LiteralPath $target) {
                    Remove-Item -LiteralPath $target -Force -ErrorAction Stop
                }
            }
            if ($createdTheme) { Remove-Item -LiteralPath $theme -ErrorAction Stop }
        } catch {
            $keepBackup = $true
            throw "Replacement failed ($replacementError); restoration failed ($_). Keep recovery copies at $staging."
        }
        throw "Replacement failed; previous theme pair restored: $replacementError"
    }
    Write-Host "Installed j3w1 $($manifest.version) at $theme. Restart Obsidian and choose the Dark base scheme."
} finally {
    if (Test-Path -LiteralPath $download) { Remove-Item -LiteralPath $download -Recurse -Force }
    if ($staging -and -not $keepBackup -and (Test-Path -LiteralPath $staging)) {
        Remove-Item -LiteralPath $staging -Recurse -Force
    }
}