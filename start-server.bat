@echo off
echo ====================================
echo  Welcome to Derry - Todo App
echo  Starting Server for Mobile/Web...
echo ====================================
echo.
echo Server will start on port 3000
echo.
echo To access from your phone:
echo 1. Connect to the same WiFi
echo 2. Find your computer IP (run: ipconfig)
echo 3. Visit http://YOUR-IP:3000 in mobile browser
echo 4. Click "Install App" to add to home screen
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0"
npm start
