@echo off
setlocal

set "API_URL=http://localhost:3000"
set /p "API_URL_INPUT=URL do backend (ENTER para http://localhost:3000): "
if not "%API_URL_INPUT%"=="" set "API_URL=%API_URL_INPUT%"

set /p "NOME=Nome (opcional): "
set /p "EMAIL=Email: "

for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$p = Read-Host 'Senha' -AsSecureString; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p); [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)"`) do set "SENHA=%%P"
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$p = Read-Host 'Confirmar senha' -AsSecureString; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p); [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)"`) do set "CONFIRMAR=%%P"

powershell -NoProfile -Command "$body=@{nome=$env:NOME;email=$env:EMAIL;senha=$env:SENHA;confirmarSenha=$env:CONFIRMAR} | ConvertTo-Json; try { $resp=Invoke-RestMethod -Uri ($env:API_URL + '/api/auth/registrar') -Method Post -ContentType 'application/json' -Body $body; Write-Output ('SUCESSO: ' + $resp.mensagem) } catch { if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream()) { $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream()); $content = $reader.ReadToEnd(); Write-Output $content } else { Write-Output $_.Exception.Message } exit 1 }"

endlocal
