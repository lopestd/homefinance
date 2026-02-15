@echo off
setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0
set ROOT_DIR=%SCRIPT_DIR%..
set IMAGE_NAME=brdocker2020/homefinance
set VERSION=1.0.0
set DOCKER_USER=lopestd@gmail.com

set /p VERSION_INPUT=Versao da imagem (ENTER para 1.0.0):
if not "%VERSION_INPUT%"=="" set VERSION=%VERSION_INPUT%
set TAG_VERSION=%IMAGE_NAME%:%VERSION%
set TAG_LATEST=%IMAGE_NAME%:latest

set /p MULTI_ARCH=Build multi-arch (amd64+arm64) e publicar? (s/N):
set MULTI_ARCH_PUSHED=0

pushd "%ROOT_DIR%"
if /I "%MULTI_ARCH%"=="s" goto buildx
if /I "%MULTI_ARCH%"=="sim" goto buildx
docker build -f "%SCRIPT_DIR%Dockerfile" -t %TAG_VERSION% -t %TAG_LATEST% "%ROOT_DIR%"
if errorlevel 1 exit /b 1
goto afterbuild

:buildx
REM Verificar se está logado no Docker Hub antes do buildx
docker info 2>nul | findstr /i "Username" >nul
if errorlevel 1 (
    echo.
    echo ============================================
    echo  Login no Docker Hub
    echo  Usuario: %DOCKER_USER%
    echo ============================================
    echo.
    docker login -u %DOCKER_USER%
    if errorlevel 1 (
        echo Falha no login. Abortando.
        exit /b 1
    )
)
docker buildx create --use --name homefinance_multiarch >nul 2>&1
docker buildx build -f "%SCRIPT_DIR%Dockerfile" --platform linux/amd64,linux/arm64 -t %TAG_VERSION% -t %TAG_LATEST% --push "%ROOT_DIR%"
if errorlevel 1 exit /b 1
set MULTI_ARCH_PUSHED=1

:afterbuild
popd

if "%MULTI_ARCH_PUSHED%"=="1" goto end
set /p DO_PUSH=Deseja enviar para o Docker Hub? (s/N):
if /I "%DO_PUSH%"=="s" goto push
if /I "%DO_PUSH%"=="sim" goto push
goto end

:push
REM Verificar login antes do push
docker info 2>nul | findstr /i "Username" >nul
if errorlevel 1 (
    echo.
    echo ============================================
    echo  Login no Docker Hub
    echo  Usuario: %DOCKER_USER%
    echo ============================================
    echo.
    docker login -u %DOCKER_USER%
    if errorlevel 1 (
        echo Falha no login. Abortando.
        exit /b 1
    )
)
docker push %TAG_VERSION%
if errorlevel 1 exit /b 1
docker push %TAG_LATEST%

:end
echo.
echo ============================================
echo  Build concluido com sucesso!
echo  Imagem: %TAG_VERSION%
echo ============================================
endlocal
