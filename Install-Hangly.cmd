@echo off
title Install Hangly
echo ========================================================
echo        Hangly Desktop Application Installer
echo ========================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
  node "%~dp0scripts\install.js"
) else (
  echo Setting up application directories...
  if not exist "%APPDATA%\Hangly\Charms" mkdir "%APPDATA%\Hangly\Charms" >nul 2>&1

  echo Creating Desktop shortcut...
  powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(\"$env:USERPROFILE\Desktop\Hangly.lnk\"); $s.TargetPath = \"%~dp0dist\Hangly-Portable.exe\"; $s.WorkingDirectory = \"%~dp0\"; $s.Description = 'Hangly - A tiny piece of motion for your desktop'; if (Test-Path \"%~dp0Assets\Icons\hangly.ico\") { $s.IconLocation = \"%~dp0Assets\Icons\hangly.ico\" }; $s.Save()" >nul 2>&1

  echo.
  echo [DONE] Hangly shortcut created on your Desktop!
)

echo.
set /p LAUNCH="Do you want to launch Hangly now? (Y/N): "
if /i "%LAUNCH%"=="Y" (
  start "" "%~dp0dist\Hangly-Portable.exe"
)
