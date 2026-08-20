# ══════════════════════════════════════════════════════════════════════════════
# 🤖 NOVARITO Discord Bot v2.0 Launcher (Windows 11 Elite / PowerShell)
# ══════════════════════════════════════════════════════════════════════════════

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$host.UI.RawUI.WindowTitle = "NOVARITO Discord Bot v2.0"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🤖 NOVARITO Discord Bot v2.0 (Windows 11 / Render WebService)" -ForegroundColor Cyan
Write-Host "======================================================================`n" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js no está instalado o no se encuentra en el PATH." -ForegroundColor Red
    Write-Host "Por favor instala Node.js (v18+) desde https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependencias npm..." -ForegroundColor Yellow
    npm install
}

Write-Host "[INFO] Iniciando Novarito Bot (Gateway, Express WebServer & AI Router)..." -ForegroundColor Green
node index.js
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Host "`n[ERROR] El bot Novarito finalizó con código: $exitCode" -ForegroundColor Red
    exit $exitCode
}
