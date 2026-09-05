@echo off
title Hentikan Monitoring Filter - PT. Anugerah Rezeki Teknindo
echo Menutup server Monitoring Filter (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
echo Menutup tunnel online Ngrok jika aktif...
taskkill /f /im ngrok.exe 2>nul
echo.
echo Server dan akses online berhasil dihentikan!
timeout /t 3 >nul
