# build.ps1 — Assemble static Vercel output from existing public/ assets.
# Run from project root: powershell -ExecutionPolicy Bypass -File static/build.ps1
# This script is ADDITIVE only — it never modifies public/ or frontend/.

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$src  = Join-Path $root "public"
$out  = $PSScriptRoot   # static/

Write-Host "=== KKL Static Build ==="
Write-Host "Source:  $src"
Write-Host "Output:  $out"

function Sync-Dir($from, $to, $filter = "*") {
    if (-not (Test-Path $from)) { Write-Host "  SKIP (missing): $from"; return }
    New-Item -ItemType Directory -Path $to -Force | Out-Null
    Copy-Item -Path (Join-Path $from $filter) -Destination $to -Recurse -Force
}

# 1. CSS
Write-Host "`n[1] Copying CSS..."
Sync-Dir (Join-Path $src "assets\css") (Join-Path $out "assets\css")

# 2. JS (vanilla main.js + any other files)
Write-Host "[2] Copying JS..."
# main.js owns static-only feedback and gallery behavior. Keep the reviewed
# static implementation rather than overwriting it with the PHP site's copy.
$jsSource = Join-Path $src "assets\js"
$jsOutput = Join-Path $out "assets\js"
New-Item -ItemType Directory -Path $jsOutput -Force | Out-Null
Get-ChildItem -LiteralPath $jsSource -File | Where-Object { $_.Name -ne 'main.js' } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $jsOutput -Force
}

# 3. Images
Write-Host "[3] Copying images..."
Sync-Dir (Join-Path $src "assets\img") (Join-Path $out "assets\img")

# 4. 3D model
Write-Host "[4] Copying 3D model..."
Sync-Dir (Join-Path $src "assets\models") (Join-Path $out "assets\models")

# 4b. Animations (Lottie JSON)
Write-Host "[4b] Copying animations..."
Sync-Dir (Join-Path $src "assets\animations") (Join-Path $out "assets\animations")

# 5. Vite built bundle (dist/)
Write-Host "[5] Copying Vite bundle..."
if (Test-Path (Join-Path $out "dist")) { Remove-Item (Join-Path $out "dist") -Recurse -Force }
Sync-Dir (Join-Path $src "dist") (Join-Path $out "dist")

# 6. Scene 3 SVG illustrations
Write-Host "[6] Copying Scene 3 illustrations..."
Sync-Dir (Join-Path $src "scene3") (Join-Path $out "scene3")

# 7. Profile photos + gallery documentation (only files referenced in static/index.html)
$indexHtml = Get-Content (Join-Path $out "index.html") -Raw -Encoding UTF8
# Reconcile exported markup with the freshly copied Vite build.
$manifestPath = Join-Path $out "dist\.vite\manifest.json"
if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $entry = $manifest.'src/main.jsx'
    if (-not $entry.file) { throw "Vite manifest is missing src/main.jsx" }
    $indexHtml = [regex]::Replace($indexHtml, 'dist/assets/main\.[^"\s]+\.js', ('dist/' + $entry.file))
    if ($entry.css.Count -gt 0) {
        $indexHtml = [regex]::Replace($indexHtml, 'dist/assets/main\.[^"\s]+\.css', ('dist/' + $entry.css[0]))
    }
}
$indexHtml = $indexHtml.Replace('<iframe src=', '<iframe loading="lazy" src=')
[System.IO.File]::WriteAllText((Join-Path $out "index.html"), $indexHtml, [System.Text.UTF8Encoding]::new($false))
$refMatches = [regex]::Matches($indexHtml, 'uploads/(profiles|gallery)/[A-Za-z0-9._-]+')
$refSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($m in $refMatches) { [void]$refSet.Add($m.Value.Replace('/', '\')) }

Write-Host "[7] Syncing referenced profile & gallery photos..."
foreach ($sub in @("uploads\profiles", "uploads\gallery")) {
    $destDir = Join-Path $out $sub
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Get-ChildItem $destDir -File -ErrorAction SilentlyContinue | ForEach-Object {
        $rel = Join-Path $sub $_.Name
        if (-not $refSet.Contains($rel)) {
            Remove-Item $_.FullName -Force
            Write-Host "  PRUNED orphan: $rel"
        }
    }
    $srcDir = Join-Path $src $sub
    if (Test-Path $srcDir) {
        Get-ChildItem $srcDir -File | Where-Object { $_.Extension -in ".jpg", ".webp" } | ForEach-Object {
            $rel = Join-Path $sub $_.Name
            if ($refSet.Contains($rel)) {
                Copy-Item $_.FullName (Join-Path $destDir $_.Name) -Force
            }
        }
    }
}

# 8. favicon (if present)
foreach ($icon in @('favicon.svg', 'favicon.ico')) {
    $favicon = Join-Path $src $icon
    if (Test-Path $favicon) {
        Copy-Item $favicon $out -Force
        Write-Host "[8] Copied $icon"
    }
}

Write-Host "`n=== Build complete ===`n"
Write-Host "Output directory: $out"
Write-Host "Files created:"
Get-ChildItem $out -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($out.Length + 1)
    $size = [math]::Round($_.Length / 1024, 1)
    Write-Host "  $rel  ($size KB)"
}
