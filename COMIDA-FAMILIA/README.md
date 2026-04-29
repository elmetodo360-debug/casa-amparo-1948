# Comida de Familia · Casa Amparo 1948

App web (SPA) interna del **menú del personal** de Casa Amparo 1948. Pensada para móvil/tablet, sin frameworks, sirve calendario mensual, recetario, normas y lista de compra del mes.

🌐 **URL pública**: https://elmetodo360-debug.github.io/casa-amparo-1948/COMIDA-FAMILIA/

📁 **Excel maestro**: `H:\Mi unidad\02_Operaciones\Comida de Familia\Comida de Familia.xlsx`

## Qué muestra
- 📅 **Calendario** — 4 semanas × 6 días con plato + guarnición.
- 📖 **Recetario** — 24 platos con pasos breves de elaboración.
- 📋 **Normas** — las 10 reglas de la comida de familia + horarios.
- 🛒 **Compra mes** — lista consolidada por proveedor con código de producto y cantidad mensual.

## Cómo actualizar
1. Edita `H:\Mi unidad\02_Operaciones\Comida de Familia\generar_excel_comida_familia.py` (cambia `MENU`, `RECETAS`, `NORMAS` o `EXTRAS_PLATO` según necesites).
2. Cierra el Excel `Comida de Familia.xlsx` si lo tienes abierto.
3. Doble-clic en `actualizar.bat` (este directorio). El bat:
   - Regenera el Excel maestro.
   - Convierte el Excel a `data/menu.json`.
   - Hace commit + push a GitHub.
4. En 1–2 minutos los cambios aparecen en la URL pública.

## Estructura
```
COMIDA-FAMILIA/
├── index.html          # SPA: 4 pestañas (Calendario, Recetario, Normas, Compra)
├── styles.css          # Estilos
├── app.js              # Lógica
├── actualizar.bat      # Pipeline 1-clic: regenerar + json + push
├── data/
│   └── menu.json       # Datos consumidos por la app (generado, no editar a mano)
├── tools/
│   └── excel_to_json.py # Conversor Excel → JSON
├── README.md
└── MEMORIA-PROYECTO.md
```

## Dependencias
- Python 3 con `openpyxl` (`pip install openpyxl`).
- Git instalado y configurado para el repo `elmetodo360-debug/casa-amparo-1948`.

## Sin datos económicos
La app NO muestra €/coste/PVP. Está diseñada para personal/cocina. Los costes están en el Excel maestro y otras herramientas internas.
