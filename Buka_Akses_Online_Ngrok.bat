@echo off
title Akses Online Ngrok - PT. Anugerah Rezeki Teknindo
cd /d "%~dp0"

echo ============================================================================
echo   MONITORING FILTER MICROCLEANER FOR DIESEL — AKSES ONLINE NGROK
echo   PT. ANUGERAH REZEKI TEKNINDO
echo ============================================================================
echo.

:: 1. Cek apakah server lokal (port 5173) sudah berjalan
echo [1/3] Memeriksa server lokal (Port 5173)...
netstat -aon | findstr :5173 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    echo [INFO] Server lokal belum aktif. Memulai Jalankan_Monitoring.bat di background...
    start "" cmd /c "Jalankan_Monitoring.bat"
    echo Menunggu server siap...
    timeout /t 5 >nul
) else (
    echo [OK] Server lokal sudah aktif di http://localhost:5173
)
echo.

:: 2. Cek apakah ngrok terpasang
echo [2/3] Memeriksa instalasi Ngrok...
where ngrok >nul 2>&1
if errorlevel 1 (
    if exist "%USERPROFILE%\scoop\shims\ngrok.exe" (
        set "NGROK_CMD=%USERPROFILE%\scoop\shims\ngrok.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\ngrok\ngrok.exe" (
        set "NGROK_CMD=%LOCALAPPDATA%\Programs\ngrok\ngrok.exe"
    ) else if exist "%~dp0ngrok.exe" (
        set "NGROK_CMD=%~dp0ngrok.exe"
    ) else (
        echo [ERROR] Program 'ngrok' tidak ditemukan di sistem!
        echo Pastikan ngrok sudah terinstall.
        echo.
        pause
        exit /b 1
    )
) else (
    set "NGROK_CMD=ngrok"
)
echo [OK] Ngrok terdeteksi: %NGROK_CMD%
echo.

:: Hentikan sesi ngrok sebelumnya jika ada
taskkill /f /im ngrok.exe >nul 2>&1

:: 3. Jalankan ngrok tunnel
echo [3/3] Membuka tunnel online (Port 5173)...
start "" /b "%NGROK_CMD%" http 5173 --host-header=rewrite >nul 2>&1

:: Tunggu tunnel terbentuk
timeout /t 3 >nul

:: 4. Ambil URL publik dari API ngrok lokal dan salin ke Clipboard
powershell -NoProfile -Command ^
    "$t = 0; $url = ''; " ^
    "while ($t -lt 15 -and [string]::IsNullOrEmpty($url)) { " ^
    "  Start-Sleep -Milliseconds 800; $t++; " ^
    "  try { $r = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 2; $url = $r.tunnels[0].public_url; } catch {} " ^
    "} " ^
    "if ($url) { " ^
    "  Set-Clipboard -Value $url; " ^
    "  Write-Host '============================================================================' -ForegroundColor Yellow; " ^
    "  Write-Host '  >>> LINK AKSES ONLINE UNTUK KANTOR / STAF:' -ForegroundColor Yellow; " ^
    "  Write-Host ('      ' + $url) -ForegroundColor Green; " ^
    "  Write-Host '============================================================================' -ForegroundColor Yellow; " ^
    "  Write-Host ''; " ^
    "  Write-Host '  [OK] Link di atas SUDAH OTOMATIS DISALIN ke Clipboard (Tinggal Paste/Ctrl+V).' -ForegroundColor White; " ^
    "  Write-Host '  [OK] Bagikan link ini via WhatsApp / Email agar staf kantor bisa membuka' -ForegroundColor White; " ^
    "  Write-Host '       aplikasi dari HP, Laptop, atau komputer kantor manapun.' -ForegroundColor White; " ^
    "  Write-Host ''; " ^
    "  Write-Host '  [PETUNJUK PENGGUNAAN NGROK]:' -ForegroundColor Cyan; " ^
    "  Write-Host '  - Saat pertama kali membuka link di browser, akan muncul halaman biru ngrok.' -ForegroundColor Cyan; " ^
    "  Write-Host '  - Cukup klik tombol Visit Site sekali, dan aplikasi akan terbuka penuh.' -ForegroundColor Cyan; " ^
    "  Write-Host '  - Biarkan jendela ini TETAP TERBUKA selama akses online digunakan.' -ForegroundColor Cyan; " ^
    "  Write-Host '  - Untuk menghentikan akses, tutup jendela ini atau jalankan Hentikan_Monitoring.exe.' -ForegroundColor Cyan; " ^
    "  Write-Host '============================================================================' -ForegroundColor Yellow; " ^
    "  Start-Process $url; " ^
    "} else { " ^
    "  Write-Host '[PERINGATAN] Menghubungkan ke ngrok... Silakan cek jendela atau browser.' -ForegroundColor Red; " ^
    "}"

echo.
echo ============================================================================
echo Tekan sembarang tombol untuk MENUTUP akses online Ngrok...
echo ============================================================================
pause >nul

:: Bersihkan proses ngrok saat ditutup
taskkill /f /im ngrok.exe >nul 2>&1
echo Akses online telah dinonaktifkan.
timeout /t 2 >nul
