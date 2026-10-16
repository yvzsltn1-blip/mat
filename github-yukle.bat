@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo === Matematik: GitHub'a yukle ===
echo Klasor: %CD%
echo Uzak:   https://github.com/yvzsltn1-blip/mat
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo Bu klasor bir git deposu degil.
  pause
  exit /b 1
)

echo Degisiklikler ekleniyor...
git add -A
if errorlevel 1 (
  echo git add basarisiz.
  pause
  exit /b 1
)

git diff --cached --quiet
if errorlevel 1 (
  for /f "tokens=1-3 delims=." %%a in ("%date%") do set "GUN=%%a-%%b-%%c"
  for /f "tokens=1-2 delims=: " %%a in ("%time%") do set "SAAT=%%a.%%b"
  git commit -m "Guncelleme %GUN% %SAAT%"
  if errorlevel 1 (
    echo.
    echo Commit basarisiz. Yukleme yapilmadi.
    pause
    exit /b 1
  )
) else (
  echo Yeni commit yok. Uzak depoya gonderiliyor...
)

echo.
echo GitHub'a gonderiliyor...
git push origin main
if errorlevel 1 (
  echo.
  echo Yukleme basarisiz.
  echo Internet baglantisini ve GitHub girisini kontrol edin.
  echo Ilk seferde bir giris penceresi acilabilir.
  pause
  exit /b 1
)

echo.
echo Tamam. Mevcut hali GitHub'a yuklendi.
echo https://github.com/yvzsltn1-blip/mat
echo.
pause
