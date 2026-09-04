@echo off
title Monitoring Filter Microcleaner For Diesel by PT. Anugerah Rezeki Teknindo
cd /d "%~dp0"
echo ============================================================================
echo   MONITORING FILTER MICROCLEANER FOR DIESEL
echo   PT. ANUGERAH REZEKI TEKNINDO
echo ============================================================================
echo.
echo Sedang memulai server...
echo Browser akan otomatis terbuka ke: http://localhost:5173
echo.
echo [INFO] Biarkan jendela ini tetap terbuka selama aplikasi digunakan.
echo [INFO] Untuk menutup aplikasi, cukup silang (close) jendela ini.
echo ============================================================================
echo.
npm run dev
