@echo off
title Update Hangly
echo ========================================================
echo               Hangly Application Updater
echo ========================================================
echo.

where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Git is not installed or not in PATH.
  echo Please install Git or download the latest release manually.
  pause
  exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
  node "%~dp0scripts\update.js"
) else (
  echo Pulling latest updates from GitHub...
  git pull
  echo.
  echo [DONE] Repository updated to latest version!
)

echo.
pause
