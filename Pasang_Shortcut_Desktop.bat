@echo off
title Pasang Shortcut Desktop
echo ============================================================================
echo   MEMBUAT SHORTCUT DESKTOP DARI EXECUTABLE (.EXE)
echo   Monitoring Filter Microcleaner For Diesel by PT. Anugerah Rezeki Teknindo
echo ============================================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$wsh = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $shortcutPath = Join-Path $desktop 'Monitoring Filter Microcleaner For Diesel by PT. Anugerah Rezeki Teknindo.lnk'; $s = $wsh.CreateShortcut($shortcutPath); $s.TargetPath = Join-Path '%~dp0' 'Monitoring_Filter.exe'; $s.WorkingDirectory = '%~dp0'; $ico = Join-Path '%~dp0' 'art_icon.ico'; if (Test-Path $ico) { $s.IconLocation = \"$ico,0\" }; $s.Description = 'Monitoring Filter Microcleaner For Diesel by PT. Anugerah Rezeki Teknindo'; $s.Save(); Write-Host 'Berhasil! Shortcut telah terpasang di Desktop Anda.' -ForegroundColor Green"
echo.
echo Selesai! Anda bisa langsung buka aplikasi lewat Shortcut di Desktop.
echo.
pause
