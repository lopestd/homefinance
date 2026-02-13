@echo off
title HomeFinance Launcher
echo ==================================================
echo Iniciando HomeFinance (Frontend + Backend)...
echo ==================================================
echo.

:: Inicia o Backend na porta 3000
echo [1/2] Iniciando Backend...
start "HomeFinance Backend" /min cmd /k "cd /d %~dp0backend && title HomeFinance Backend && node server.js"

:: Aguarda um pouco para o backend subir
timeout /t 2 /nobreak >nul

:: Inicia o Frontend (Vite)
echo [2/2] Iniciando Frontend...
start "HomeFinance Frontend" cmd /k "cd /d %~dp0frontend && title HomeFinance Frontend && npm run dev"

echo.
echo Servidores iniciados!
echo Backend rodando em: http://localhost:3000
echo Frontend rodando em: http://localhost:5173
echo.
echo Pode fechar esta janela, os servidores continuarao rodando.
pause
