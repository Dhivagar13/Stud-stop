@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

title Stud-Stop

echo ^===========================================^
echo ^          STUD-STOP  LAUNCHER              ^
echo ^===========================================^
echo.

if not exist "package.json" (
  echo [ERROR] package.json not found. Run this from the project root.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [..] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [FAIL] npm install failed.
    pause
    exit /b 1
  )
  echo [OK] Dependencies installed.
  echo.
)

:menu
cls
echo ^===========================================^
echo ^          STUD-STOP  LAUNCHER              ^
echo ^===========================================^
echo.
echo Select a run mode:
echo.
echo   [1] Start Expo dev server (QR code)
echo   [2] Run on Android
echo   [3] Run on iOS
echo   [4] Run on Web browser
echo   [5] Run lint check
echo   [6] Run tests
echo   [7] Clear cache + restart
echo   [8] Exit
echo.
set /p choice="Enter choice (1-8): "

if "%choice%"=="1" (
  echo.
  echo Starting Expo dev server...
  echo Scan the QR code with Expo Go app.
  echo.
  call npx expo start
  goto end
)

if "%choice%"=="2" (
  echo.
  echo Building and running on Android...
  call npx expo run:android
  goto end
)

if "%choice%"=="3" (
  echo.
  echo Building and running on iOS...
  call npx expo run:ios
  goto end
)

if "%choice%"=="4" (
  echo.
  echo Starting Expo web...
  call npx expo start --web
  goto end
)

if "%choice%"=="5" (
  call npx expo lint
  echo.
  pause
  goto menu
)

if "%choice%"=="6" (
  call npx jest
  echo.
  pause
  goto menu
)

if "%choice%"=="7" (
  echo.
  echo Clearing Metro cache...
  if exist "node_modules\expo" (
    call npx expo start --clear
  ) else (
    npx react-native start --reset-cache
  )
  goto end
)

if "%choice%"=="8" (
  echo Bye!
  goto end
)

echo Invalid choice. Try again.
ping -n 2 127.0.0.1 >nul
goto menu

:end
echo.
pause
endlocal
