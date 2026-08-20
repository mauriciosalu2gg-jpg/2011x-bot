@echo off
chcp 65001 >nul
title NOVARITO Discord Bot v2.0
cd /d "%~dp0"

echo ======================================================================
echo   🤖 NOVARITO Discord Bot v2.0 (Windows 11 / Render WebService)
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado o no se encuentra en el PATH.
    echo Por favor instala Node.js (v18+) desde https://nodejs.org/
    pause
    exit /b 1
)

if not exist node_modules (\n    echo [INFO] Instalando dependencias npm...\n    npm install\n)

echo [INFO] Iniciando Novarito Bot (Gateway, Express WebServer & AI Router)...
node index.js
if %errorlevel% neq 0 (
    pause
)
