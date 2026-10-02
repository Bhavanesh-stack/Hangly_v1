@echo off
title Uninstall Hangly
echo ========================================================
echo   Hangly Complete Application and Data Removal
echo ========================================================
echo.
echo Stopping running Hangly processes...
taskkill /F /IM Hangly.exe >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1

echo Removing startup registry entry...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v Hangly /f >nul 2>&1

echo Deleting application data, custom charms, and cache...
if exist "%APPDATA%\Hangly" rmdir /S /Q "%APPDATA%\Hangly" >nul 2>&1
if exist "%APPDATA%\hangly" rmdir /S /Q "%APPDATA%\hangly" >nul 2>&1

if exist "%USERPROFILE%\Desktop\Hangly.lnk" del /F /Q "%USERPROFILE%\Desktop\Hangly.lnk" >nul 2>&1

echo.
echo [DONE] Hangly has been completely removed from your system.
echo.
pause
