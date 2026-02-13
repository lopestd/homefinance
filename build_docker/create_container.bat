@echo off
setlocal
set IMAGE_NAME=brdocker2020/homefinance
set VERSION=latest
set /p VERSION_INPUT=Tag da imagem (ENTER para latest):
if not "%VERSION_INPUT%"=="" set VERSION=%VERSION_INPUT%
set IMAGE=%IMAGE_NAME%:%VERSION%

set /p CONTAINER_NAME=Nome do container (ENTER para homefinance):
if "%CONTAINER_NAME%"=="" set CONTAINER_NAME=homefinance
set /p HOST_PORT=Porta local (ENTER para 3000):
if "%HOST_PORT%"=="" set HOST_PORT=3000

set /p DB_HOST=DB_HOST:
if "%DB_HOST%"=="" (
  echo DB_HOST obrigatorio.
  exit /b 1
)
set /p DB_PORT=DB_PORT (ENTER para 5432):
if "%DB_PORT%"=="" set DB_PORT=5432
set /p DB_NAME=DB_NAME:
if "%DB_NAME%"=="" (
  echo DB_NAME obrigatorio.
  exit /b 1
)
set /p DB_USER=DB_USER:
if "%DB_USER%"=="" (
  echo DB_USER obrigatorio.
  exit /b 1
)
set /p DB_PASS=DB_PASS:
if "%DB_PASS%"=="" (
  echo DB_PASS obrigatorio.
  exit /b 1
)
set /p JWT_SECRET=JWT_SECRET:
if "%JWT_SECRET%"=="" (
  echo JWT_SECRET obrigatorio.
  exit /b 1
)

docker run -d --name %CONTAINER_NAME% -p %HOST_PORT%:3000 -e DB_HOST=%DB_HOST% -e DB_PORT=%DB_PORT% -e DB_NAME=%DB_NAME% -e DB_USER=%DB_USER% -e DB_PASS=%DB_PASS% -e JWT_SECRET=%JWT_SECRET% %IMAGE%
