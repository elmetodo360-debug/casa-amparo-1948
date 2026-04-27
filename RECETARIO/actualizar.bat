@echo off
setlocal
chcp 65001 >nul
title Actualizar Recetario CCA1948

echo.
echo  ============================================================
echo    Casa Amparo 1948 - Actualizar Recetario
echo  ============================================================
echo.

REM 1. Posicionarse en la carpeta de este .bat
cd /d "%~dp0"

REM 2. Comprobar que el Excel no esta abierto (el script falla si lo esta)
echo [1/4] Comprobando que el Excel maestro no este abierto...
set "EXCEL=H:\Mi unidad\02_Operaciones\FT Casa Amparo v2.xlsx"
if not exist "%EXCEL%" (
  echo.
  echo  ERROR: No se encuentra el Excel en:
  echo    %EXCEL%
  echo.
  echo  Comprueba que H: este montado (Google Drive activo).
  goto :error
)
REM Detectar si Excel tiene el archivo bloqueado (lock file ~$...)
if exist "H:\Mi unidad\02_Operaciones\~$FT Casa Amparo v2.xlsx" (
  echo.
  echo  ATENCION: El Excel parece estar abierto.
  echo  Cierra Excel completamente antes de continuar.
  echo.
  pause
)

REM 3. Regenerar JSON + fotos
echo.
echo [2/4] Extrayendo recetas y fotos del Excel...
echo.
python tools\excel_to_json.py
if errorlevel 1 goto :error

REM 4. Subir cambios a GitHub
echo.
echo [3/4] Comprobando cambios...
cd /d "%~dp0\.."
git add RECETARIO/
git diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo  Sin cambios que subir. El recetario ya esta al dia.
  goto :ok
)

echo.
echo [4/4] Subiendo cambios a GitHub...
for /f "tokens=1-3 delims=/-. " %%a in ("%date%") do set FECHA=%%c-%%b-%%a
for /f "tokens=1-2 delims=:." %%a in ("%time%") do set HORA=%%a:%%b
git commit -m "Actualizar recetario %FECHA% %HORA%"
if errorlevel 1 goto :error
git push
if errorlevel 1 goto :error

:ok
echo.
echo  ============================================================
echo    LISTO. Recetario actualizado.
echo  ============================================================
echo.
echo    URL publica:
echo    https://elmetodo360-debug.github.io/casa-amparo-1948/RECETARIO/
echo.
echo    Los cambios estaran visibles en 1-2 minutos.
echo    (GitHub Pages tarda un poco en republicar)
echo.
pause
exit /b 0

:error
echo.
echo  ============================================================
echo    ERROR. Revisa el mensaje de arriba.
echo  ============================================================
echo.
pause
exit /b 1
