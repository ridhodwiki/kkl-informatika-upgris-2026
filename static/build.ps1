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
Sync-Dir (Join-Path $src "assets\js") (Join-Path $out "assets\js")

# 3. Images
Write-Host "[3] Copying images..."
Sync-Dir (Join-Path $src "assets\img") (Join-Path $out "assets\img")

# 4. 3D model
Write-Host "[4] Copying 3D model..."
Sync-Dir (Join-Path $src "assets\models") (Join-Path $out "assets\models")

# 5. Vite built bundle (dist/)
Write-Host "[5] Copying Vite bundle..."
if (Test-Path (Join-Path $out "dist")) { Remove-Item (Join-Path $out "dist") -Recurse -Force }
Sync-Dir (Join-Path $src "dist") (Join-Path $out "dist")

# 6. Scene 3 SVG illustrations
Write-Host "[6] Copying Scene 3 illustrations..."
Sync-Dir (Join-Path $src "scene3") (Join-Path $out "scene3")

# 7. Profile photos + gallery documentation (committed webp images)
Write-Host "[7] Copying profile photos..."
$profileDest = Join-Path $out "uploads\profiles"
New-Item -ItemType Directory -Path $profileDest -Force | Out-Null
Get-ChildItem (Join-Path $src "uploads\profiles") -File | Where-Object { $_.Extension -in ".jpg", ".webp" } | ForEach-Object {
    Copy-Item $_.FullName $profileDest -Force
}

Write-Host "[7b] Copying gallery photos..."
$galleryDest = Join-Path $out "uploads\gallery"
New-Item -ItemType Directory -Path $galleryDest -Force | Out-Null
Get-ChildItem (Join-Path $src "uploads\gallery") -File | Where-Object { $_.Extension -in ".webp", ".jpg" } | ForEach-Object {
    Copy-Item $_.FullName $galleryDest -Force
}
# NOTE: files deleted from public/uploads are not removed here. Run
# tools/export-static.php for the DB-driven gallery/profile markup.
# TODO: add image compression if build size needs another pass.

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
