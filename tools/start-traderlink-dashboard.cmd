@echo off
setlocal

set "TRADERLINK_ROOT=C:\Users\jerac\Documents\TraderLink\traderslink.pro"
set "TRADERLINK_URL=http://127.0.0.1:3010/workspace"

if not exist "%TRADERLINK_ROOT%\src\scripts\run-trader-intelligence-local-server.ts" goto :missing_project

for /f "usebackq delims=" %%B in (`git -C "%TRADERLINK_ROOT%" branch --show-current`) do set "TRADERLINK_BRANCH=%%B"
if /I not "%TRADERLINK_BRANCH%"=="main" goto :wrong_branch

powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener = Get-NetTCPConnection -LocalPort 3010 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($null -ne $listener) { exit 7 }"
if errorlevel 7 goto :port_in_use

powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$root = '%TRADERLINK_ROOT%'; Start-Process -FilePath (Join-Path $root 'node_modules\.bin\tsx.cmd') -ArgumentList 'src\scripts\run-trader-intelligence-local-server.ts --dev --webpack --hostname 127.0.0.1 --port 3010' -WorkingDirectory $root -WindowStyle Hidden"

for /L %%N in (1,1,40) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener = Get-NetTCPConnection -LocalPort 3010 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($null -ne $listener) { exit 0 } else { exit 1 }"
  if not errorlevel 1 goto :open_dashboard
  timeout /t 1 /nobreak >nul
)

echo TraderLink Dashboard did not start on port 3010.
pause
exit /b 1

:open_dashboard
start "" "%TRADERLINK_URL%"
exit /b 0

:missing_project
echo TraderLink Dashboard could not find the canonical main app.
pause
exit /b 1

:wrong_branch
echo TraderLink Dashboard starts only from main.
echo Current branch: %TRADERLINK_BRANCH%
pause
exit /b 1

:port_in_use
echo Port 3010 is already in use.
echo Close that dashboard before starting the canonical main dashboard.
pause
exit /b 1
