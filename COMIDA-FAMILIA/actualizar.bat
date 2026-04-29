@echo off
chcp 65001 >nul
title Actualizar Comida de Familia
cd /d "%~dp0"

echo.
echo ============================================================
echo   ACTUALIZAR COMIDA DE FAMILIA - Casa Amparo 1948
echo ============================================================
echo.

REM 1. Comprobar Excel cerrado
echo [1/4] Comprobando que el Excel maestro este cerrado...
python -c "import openpyxl; openpyxl.load_workbook(r'H:\Mi unidad\02_Operaciones\Comida de Familia\Comida de Familia.xlsx'); print('OK')" 2>nul
if errorlevel 1 (
    echo.
    echo   [ERROR] El Excel maestro esta abierto o no existe.
    echo   Cierra "Comida de Familia.xlsx" en Drive y vuelve a ejecutar.
    pause
    exit /b 1
)

REM 2. Regenerar Excel maestro desde el script en Drive
echo [2/4] Regenerando Excel maestro...
python "H:\Mi unidad\02_Operaciones\Comida de Familia\generar_excel_comida_familia.py"
if errorlevel 1 (
    echo   [ERROR] Fallo la generacion del Excel.
    pause
    exit /b 1
)

REM 3. Convertir Excel a JSON para la app
echo [3/4] Generando data\menu.json...
python tools\excel_to_json.py
if errorlevel 1 (
    echo   [ERROR] Fallo la conversion a JSON.
    pause
    exit /b 1
)

REM 4. Commit + push a GitHub Pages
echo [4/4] Subiendo a GitHub...
cd ..
git add COMIDA-FAMILIA/
git commit -m "Actualizar Comida de Familia (auto)" 2>nul
if errorlevel 1 (
    echo   (Sin cambios para commitear)
) else (
    git push
)

echo.
echo ============================================================
echo   LISTO. La app estara actualizada en 1-2 minutos en:
echo   https://elmetodo360-debug.github.io/casa-amparo-1948/COMIDA-FAMILIA/
echo ============================================================
echo.
pause
