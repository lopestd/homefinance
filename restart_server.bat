@echo off
echo Reiniciando o servidor...
taskkill /F /IM node.exe
timeout /t 2
cd frontend
start "HomeFinance Server" npm run dev
echo Servidor reiniciado em nova janela.
pause