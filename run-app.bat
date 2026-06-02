@echo off
setlocal

cd /d "%~dp0"

echo Starting Stud Stop...
echo.

if not exist "package.json" (
  echo package.json was not found. Run this file from the project folder.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Choose a run target:
echo   1. Expo dev server
echo   2. Android app
echo   3. Web browser
echo.
set /p target="Enter 1, 2, or 3: "

if "%target%"=="2" (
  call npm run android
) else if "%target%"=="3" (
  call npm run web
) else (
  call npm start
)

if errorlevel 1 (
  echo.
  echo Stud Stop failed to start.
  pause
  exit /b 1
)

endlocal
