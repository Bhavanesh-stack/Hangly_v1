@echo off
setlocal enabledelayedexpansion
title Hangly Desktop Companion

:MENU
cls
echo ====================================================================
echo                   HANGLY DESKTOP COMPANION
echo        A tiny piece of motion for your desktop. 240Hz Verlet.
echo ====================================================================
echo.
echo   [1] Launch Hangly (Start Desktop Companion)
echo   [2] Install Shortcuts (Create Desktop and Start Menu icons)
echo   [3] Update Hangly (Pull latest features and charms from GitHub)
echo   [4] Rebuild Standalone Executable (Compile Hangly-Portable.exe)
echo   [5] Uninstall and Delete (Completely remove app, data, and cache)
echo   [6] Exit
echo.
echo ====================================================================
set /p CHOICE="Please select an option (1-6): "

if "%CHOICE%"=="1" goto LAUNCH
if "%CHOICE%"=="2" goto INSTALL
if "%CHOICE%"=="3" goto UPDATE
if "%CHOICE%"=="4" goto BUILD
if "%CHOICE%"=="5" goto UNINSTALL
if "%CHOICE%"=="6" goto EXIT

echo Invalid option. Please select between 1 and 6.
timeout /t 2 >nul
goto MENU

:LAUNCH
cls
echo Starting Hangly Desktop Companion...
if exist "%~dp0dist\Hangly-Portable.exe" (
  start "" "%~dp0dist\Hangly-Portable.exe"
) else (
  call npm start
)
goto EXIT

:INSTALL
cls
call "%~dp0Install-Hangly.cmd"
pause
goto MENU

:UPDATE
cls
call "%~dp0Update-Hangly.cmd"
goto MENU

:BUILD
cls
echo Building Hangly-Portable.exe...
call npm run build:portable
echo.
pause
goto MENU

:UNINSTALL
cls
call "%~dp0Uninstall-Hangly.cmd"
goto EXIT

:EXIT
exit
