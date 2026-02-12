@echo off
echo Parando servidores HomeFinance...
echo.

:: Encerra processos pelo titulo da janela
taskkill /FI "WINDOWTITLE eq HomeFinance Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq HomeFinance Frontend*" /F >nul 2>&1

:: Encerra processos node específicos caso as janelas tenham sido fechadas mas o processo continue
wmic process where "name='node.exe' and commandline like '%%server.js%%'" call terminate >nul 2>&1
wmic process where "name='node.exe' and commandline like '%%vite%%'" call terminate >nul 2>&1

echo Servidores parados.
timeout /t 2
