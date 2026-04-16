@echo off
echo Restarting Chrome with remote debugging...
echo Your tabs will be restored automatically.
echo.

:: Kill Chrome
taskkill /IM chrome.exe /F >nul 2>&1
timeout /t 3 /nobreak >nul

:: Create junction if it doesn't exist
if not exist "C:\Users\dell\ChromeDebug" (
    mklink /J "C:\Users\dell\ChromeDebug" "C:\Users\dell\AppData\Local\Google\Chrome\User Data" >nul 2>&1
)

:: Start Chrome with debugging
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\dell\ChromeDebug" --profile-directory="Profile 13" --restore-last-session

echo Chrome started! You can now scrape jobs.
