@echo off
setlocal
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 and Git, then run this setup again.
  pause
  exit /b 1
)
node.exe "%~dp0setup.mjs" %*
set "setup_result=%errorlevel%"
if "%~1"=="" pause
exit /b %setup_result%
