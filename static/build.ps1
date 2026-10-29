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
Sync-Dir (Join-Path $src "dist") (Join-Path $out "dist")

# 6. Scene 3 SVG illustrations
Write-Host "[6] Copying Scene 3 illustrations..."
Sync-Dir (Join-Path $src "scene3") (Join-Path $out "scene3")

# 7. Profile placeholder photos (committed JPGs only — no real WebPs)
Write-Host "[7] Copying profile placeholder photos..."
$profileDest = Join-Path $out "uploads\profiles"
New-Item -ItemType Directory -Path $profileDest -Force | Out-Null
Get-ChildItem (Join-Path $src "uploads\profiles") -Filter "*.jpg" | ForEach-Object {
    Copy-Item $_.FullName $profileDest -Force
}
# NOTE: Real uploaded WebPs (profile_*.webp) are gitignored for Vercel —
# they may contain personal photos of team members. Copy manually if approved.

# 8. favicon (if present)
$favicon = Join-Path $src "favicon.ico"
if (Test-Path $favicon) {
    Copy-Item $favicon $out -Force
    Write-Host "[8] Copied favicon.ico"
} else {
    Write-Host "[8] No favicon.ico found (skipped)"
}

Write-Host "`n=== Build complete ===`n"
Write-Host "Output directory: $out"
Write-Host "Files created:"
Get-ChildItem $out -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($out.Length + 1)
    $size = [math]::Round($_.Length / 1024, 1)
    Write-Host "  $rel  ($size KB)"
}
