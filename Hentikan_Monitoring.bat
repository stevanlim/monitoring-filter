@echo off
title Hentikan Monitoring Filter - PT. Anugerah Rezeki Teknindo
echo Menutup server Monitoring Filter (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
echo.
echo Server berhasil dihentikan!
timeout /t 3 >nul
