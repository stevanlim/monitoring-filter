@echo off
title Pasang Shortcut Desktop
echo ============================================================================
echo   MEMBUAT SHORTCUT DESKTOP DARI EXECUTABLE (.EXE)
echo   Monitoring Filter Microcleaner For Diesel by PT. Anugerah Rezeki Teknindo
echo ============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$wsh = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$dir = '%~dp0'.TrimEnd('\'); " ^
  "$ico = Join-Path $dir 'art_icon.ico'; " ^
  "$s1 = $wsh.CreateShortcut((Join-Path $desktop 'Monitoring Filter Microcleaner For Diesel by PT. Anugerah Rezeki Teknindo.lnk')); " ^
  "$s1.TargetPath = Join-Path $dir 'Monitoring_Filter.exe'; " ^
  "$s1.WorkingDirectory = $dir; " ^
  "if (Test-Path $ico) { $s1.IconLocation = \"$ico,0\" }; " ^
  "$s1.Description = 'Buka Aplikasi Monitoring Filter Lokal'; " ^
  "$s1.Save(); " ^
  "$s2 = $wsh.CreateShortcut((Join-Path $desktop 'Akses Online Ngrok - Monitoring Filter.lnk')); " ^
  "$s2.TargetPath = Join-Path $dir 'Buka_Akses_Online_Ngrok.exe'; " ^
  "$s2.WorkingDirectory = $dir; " ^
  "if (Test-Path $ico) { $s2.IconLocation = \"$ico,0\" }; " ^
  "$s2.Description = 'Buka Akses Online Ngrok untuk Staf / Kantor'; " ^
  "$s2.Save(); " ^
  "$s3 = $wsh.CreateShortcut((Join-Path $desktop 'Hentikan Monitoring Filter.lnk')); " ^
  "$s3.TargetPath = Join-Path $dir 'Hentikan_Monitoring.exe'; " ^
  "$s3.WorkingDirectory = $dir; " ^
  "if (Test-Path $ico) { $s3.IconLocation = \"$ico,0\" }; " ^
  "$s3.Description = 'Hentikan Server dan Akses Online Ngrok'; " ^
  "$s3.Save(); " ^
  "Write-Host '[OK] 3 Shortcut telah berhasil dipasang di Desktop:' -ForegroundColor Green; " ^
  "Write-Host '     1. Monitoring Filter Microcleaner For Diesel' -ForegroundColor White; " ^
  "Write-Host '     2. Akses Online Ngrok - Monitoring Filter' -ForegroundColor White; " ^
  "Write-Host '     3. Hentikan Monitoring Filter' -ForegroundColor White; "
echo.
echo Selesai! Anda bisa langsung buka aplikasi atau aktifkan akses online lewat Desktop.
echo.
pause
