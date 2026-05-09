<#
.SYNOPSIS
  Copia las reglas .mdc de vmDev desde tu perfil local al repo actual (The_Road).

.DESCRIPTION
  Origen habitual: %USERPROFILE%\.cursor\rules\
  Destino: <repo>\.cursor\rules\

  Las reglas “globales” del IDE no siempre se pueden sincronizar por archivo; si usas
  un consolidado en markdown, ábrelo y pégalo donde el editor permita reglas de usuario.

.PARAMETER DryRun
  Solo muestra qué haría sin copiar.

.PARAMETER CopyUserRulesToClipboard
  Tras sincronizar, copia global-user-rules-consolidated.md al portapapeles para pegar en reglas de usuario.

.EXAMPLE
  .\scripts\apply-vmdev-rules.ps1
  .\scripts\apply-vmdev-rules.ps1 -DryRun
  .\scripts\apply-vmdev-rules.ps1 -CopyUserRulesToClipboard
#>
param(
  [switch] $DryRun,
  [switch] $CopyUserRulesToClipboard
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ProfileRules = Join-Path $env:USERPROFILE ".cursor\rules"
$Dest = Join-Path $RepoRoot ".cursor\rules"
$Consolidated = Join-Path $env:USERPROFILE ".cursor\global-user-rules-consolidated.md"

Write-Host ""
Write-Host "=== Aplicar reglas vmDev al repo ===" -ForegroundColor Cyan
Write-Host "Repo:        $RepoRoot"
Write-Host "Origen:      $ProfileRules"
Write-Host "Destino:     $Dest"
Write-Host ""

if (-not (Test-Path -LiteralPath $ProfileRules)) {
  Write-Host "No existe la carpeta de reglas del perfil: $ProfileRules" -ForegroundColor Red
  Write-Host "Opciones: instala/copia las reglas desde vmDevWeb, o pégalas manualmente desde GitHub." -ForegroundColor Yellow
  exit 1
}

$m = Get-ChildItem -LiteralPath $ProfileRules -Filter "*.mdc" -ErrorAction SilentlyContinue
if (-not $m) {
  Write-Host "No hay archivos .mdc en $ProfileRules" -ForegroundColor Red
  exit 1
}

if ($DryRun) {
  Write-Host "[DryRun] Se copiarían $($m.Count) archivo(s) .mdc:" -ForegroundColor Yellow
  $m | ForEach-Object { Write-Host "  - $($_.Name)" }
  Write-Host ""
  Write-Host "the-road-baseline.mdc del repo solo se sobrescribe si existe uno igual en el perfil (no suele)." -ForegroundColor DarkGray
  exit 0
}

New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item -Path (Join-Path $ProfileRules "*.mdc") -Destination $Dest -Force

Write-Host "Listo: copiados $($m.Count) .mdc a .cursor/rules/" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente (reglas globales del IDE):" -ForegroundColor Cyan
if (Test-Path -LiteralPath $Consolidated) {
  Write-Host "  1) Abre la configuración del editor → Reglas de usuario"
  Write-Host "  2) Pega todo el contenido de:"
  Write-Host "     $Consolidated"
}
else {
  Write-Host "  No encontré global-user-rules-consolidated.md bajo tu perfil."
  Write-Host "  Si lo tienes en otro sitio, pégalo donde el editor exponga reglas de usuario."
}
Write-Host ""

if ($CopyUserRulesToClipboard -and -not $DryRun) {
  if (Test-Path -LiteralPath $Consolidated) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.Clipboard]::SetText((Get-Content -LiteralPath $Consolidated -Raw -Encoding UTF8))
    Write-Host "Reglas consolidadas copiadas al portapapeles — pégalas en Reglas de usuario del IDE." -ForegroundColor Green
    Write-Host ""
  }
}
