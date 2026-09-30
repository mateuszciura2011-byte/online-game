@echo off
rem Open the local game in a browser that supports pointer capture.
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-window "http://127.0.0.1:5173/"
  exit /b
)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
  start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --new-window "http://127.0.0.1:5173/"
  exit /b
)
echo Open http://127.0.0.1:5173/ in Chrome or Edge. Keep the game server running.
pause
