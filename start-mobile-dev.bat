@echo off
echo ========================================
echo  Pennywise Todo - Mobile Dev Server
echo ========================================
echo.
echo Starting backend server...
echo Server will run on http://localhost:3000
echo.
echo Keep this window open while developing!
echo Press Ctrl+C to stop the server.
echo.
echo ========================================
echo.

start "Pennywise Mobile Dev" cmd /k "npm start"

timeout /t 3 /nobreak >nul

echo.
echo Backend server started!
echo.
echo Next steps:
echo 1. For Android: npm run mobile:android
echo 2. For iOS: npm run mobile:ios
echo.
echo See MOBILE-BUILD-GUIDE.md for complete instructions
echo.

pause
