<#
.SYNOPSIS
  Copia vmDev PRO (global-user-rules-consolidated.md) al portapapeles para pegarlo en Reglas de usuario del IDE.

.NOTAS
  Los editores suelen gestionar las reglas globales solo desde la interfaz; este script reduce el paso a copiar y pegar.

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
Write-Host "Listo: texto de reglas de usuario copiado al portapapeles (UTF-8)." -ForegroundColor Green
Write-Host "  Configuración del editor → Reglas de usuario → pega con Ctrl+V y guarda."
Write-Host ""
