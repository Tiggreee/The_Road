<#
.SYNOPSIS
  Copia vmDev PRO (global-user-rules-consolidated.md) al portapapeles para pegarla en Cursor → Settings → Rules.

.NOTAS
  Cursor no permite inyectar User Rules por archivo de configuración en disco de forma oficial.
  Esto reduce el trabajo a: abrir Cursor → Rules → Ctrl+V → guardar.

.EXAMPLE
  .\scripts\copy-vmdev-user-rules-to-clipboard.ps1
#>
$ErrorActionPreference = "Stop"
$src = Join-Path $env:USERPROFILE ".cursor\global-user-rules-consolidated.md"

if (-not (Test-Path -LiteralPath $src)) {
  Write-Host "No existe: $src" -ForegroundColor Red
  exit 1
}

$txt = Get-Content -LiteralPath $src -Raw -Encoding UTF8
# Clipboard Unicode en Windows (.NET API; evita errores de parámetros de Set-Clipboard según versión).
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Clipboard]::SetText($txt)

Write-Host ""
Write-Host "Listo: texto de User Rules copiado al portapapeles (UTF-8)." -ForegroundColor Green
Write-Host "  Cursor → Settings → Rules (User Rules) → pega con Ctrl+V y guarda."
Write-Host ""
