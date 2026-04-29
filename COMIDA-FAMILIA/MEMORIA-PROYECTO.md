# MEMORIA DEL PROYECTO — Comida de Familia · Casa Amparo 1948

> Documento de contexto para cualquier IA (Claude, ChatGPT, etc.) o persona que vaya a trabajar sobre esta aplicación. **Mantener al día** cuando cambie algo estructural.

**Última actualización**: 2026-04-29

---

## 1. Qué es esta app

App web (SPA) interna del **menú del personal** (también llamado "comida de familia") de Casa Amparo 1948. Sirve cuatro vistas:

- **Calendario mensual**: 4 semanas × 6 días, plato + guarnición.
- **Recetario**: pasos breves de elaboración + ingredientes para 10 personas.
- **Normas**: las 10 reglas de convivencia y descanso para la comida de familia.
- **Compra mes**: lista consolidada por proveedor (código + cantidad mensual).

**Lo más importante — qué NO se muestra**: ningún dato económico. El equipo de personal/cocina nunca ve costes, PVP, márgenes, €/kg ni precios. Eso queda solo en el Excel maestro y en otras herramientas internas.

**Cliente final**: Casa Amparo 1948 (Madrid).
**Desarrollo**: Chema González · El Método 360.

---

## 2. URLs y rutas

| Qué | Dónde |
|---|---|
| **App pública** | https://elmetodo360-debug.github.io/casa-amparo-1948/COMIDA-FAMILIA/ |
| **Repo GitHub** | https://github.com/elmetodo360-debug/casa-amparo-1948 (subcarpeta `/COMIDA-FAMILIA/`) |
| **Excel maestro** | `H:\Mi unidad\02_Operaciones\Comida de Familia\Comida de Familia.xlsx` |
| **Script generador del Excel** | `H:\Mi unidad\02_Operaciones\Comida de Familia\generar_excel_comida_familia.py` |
| **Carpeta del repo local** | `C:\Users\jmgon\OneDrive - El metodo 360 consultoria Integral S.l\Claude Code\Casa Amparo 1948\COMIDA-FAMILIA\` |
| Hosting | GitHub Pages, rama `master`, raíz `/` |

> ⚠️ A diferencia del Recetario, esta app **no tiene contraseña**. El contenido (normas, calendario, recetas básicas) no es sensible y conviene que cualquier camarero/cocinero pueda consultarla rápido sin barrera.

---

## 3. Stack técnico

- **SPA vanilla JS** (sin frameworks). Mismo patrón que RECETARIO y PEDIDOS.
- **Estilo**: CSS puro con variables, paleta Casa Amparo (azul marino + dorado + crema).
- **Datos**: `data/menu.json` generado desde el Excel maestro.
- **Hosting**: GitHub Pages legacy desde rama `master`.

---

## 4. Pipeline de actualización

```
[Editar generar_excel_comida_familia.py]   ← fuente de verdad
        ↓
[python generar_excel_comida_familia.py]   ← genera el .xlsx
        ↓
[python tools/excel_to_json.py]            ← .xlsx → data/menu.json
        ↓
[git add + commit + push]
        ↓
[GitHub Pages publica en 1-2 min]
```

`actualizar.bat` ejecuta los 4 pasos en orden y avisa si el Excel está abierto.

### Qué editar para cada cambio

| Cambio que quieres hacer | Edita en | Sección |
|---|---|---|
| Cambiar plato del menú | `generar_excel_comida_familia.py` | `MENU` |
| Cambiar pasos de una receta | `generar_excel_comida_familia.py` | `RECETAS` |
| Cambiar/añadir norma | `generar_excel_comida_familia.py` | `NORMAS` |
| Añadir/quitar ingrediente de un plato | `generar_excel_comida_familia.py` | `EXTRAS_PLATO` |
| Cambiar tipo de guarnición | `generar_excel_comida_familia.py` | `GUARNICIONES` |
| Cambiar número de comensales | `generar_excel_comida_familia.py` | `PERSONAS` |
| Actualizar precio/código de ingrediente | `generar_excel_comida_familia.py` | `ING` |

**No editar nunca** `data/menu.json` ni el `.xlsx` a mano — se regeneran.

---

## 5. Estructura JSON

```json
{
  "actualizado": "YYYY-MM-DD",
  "personas": 10,
  "normas": [{"numero": 1, "titulo": "...", "detalle": "..."}],
  "horarios": [{"nombre": "Mañana", "rango": "11:30 – 13:00"}],
  "calendario": [{"semana": 1, "dia": "Lunes", "plato": "...", "guarnicion": "...", "esPescado": false}],
  "recetas": [{
    "semana": 1, "dia": "Lunes", "plato": "...", "esPescado": false,
    "guarnicion": "...", "pasos": ["...", "..."],
    "ingredientes": [{"tipo": "Proteína", "nombre": "...", "proveedor": "...",
                      "codigo": "...", "udm": "GR", "cantidad": 2000}]
  }],
  "compraTotal": [{"proveedor": "...", "codigo": "...", "producto": "...",
                   "udm": "GR", "cantidad": 4000}]
}
```

`compraTotal` está agrupado por proveedor en la app.

---

## 6. Las 10 normas (referencia rápida)

1. Una sola comida al día por persona.
2. Siempre en el comedor de familia.
3. 1 refresco/día — formato 2 L compartido.
4. Resto del tiempo: agua de grifo.
5. Al cierre: 1 cerveza o tinto de verano por persona, **siempre de tirador**.
6. Comedor recogido tras cada uso.
7. Tiempo de comida: **30 min**.
8. Horario lo destina el responsable de turno.
9. Día libre: avisar al jefe de cocina; horario 11:30–13:00 / 16:30–19:30.
10. Descanso: **30 min** (incluye fumar).

---

## 7. Decisiones de diseño tomadas

- **Sin login**: las normas/horarios deben ser consultables sin fricción.
- **Sin €**: principio compartido con RECETARIO — cocina/personal nunca ve costes.
- **Pestañas**, no scroll único: cuatro vistas son lo bastante diferentes para no mezclarlas.
- **Calendario en tarjetas pequeñas**, no tabla, para que en móvil se vea bien.
- **Detalle modal** al pulsar un plato: muestra pasos + ingredientes con código.
- **Compra agrupada por proveedor** (no por día) en la pestaña de compra: es la vista útil para hacer pedidos. Si un día se necesita ver compra POR DÍA, está en la hoja "Compra Detalle" del Excel.

---

## 8. TODOs / mejoras pendientes

- [ ] Añadir foto a cada plato (similar al recetario principal). Hoy no hay fotos.
- [ ] Marcar el plato del día actual basándose en la fecha (rotación quincenal/mensual).
- [ ] Modo "imprimir" para sacar el calendario a papel.
- [ ] Exportar lista de compra a PDF/email para mandarlo al proveedor.
