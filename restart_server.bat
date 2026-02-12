@echo off
echo Reiniciando HomeFinance Completo...
echo.

call "%~dp0stop_server.bat"
timeout /t 2 /nobreak
call "%~dp0start_server.bat"
