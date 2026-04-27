# MEMORIA DEL PROYECTO — Recetario Casa Amparo 1948

> Documento de contexto para cualquier IA (Claude, ChatGPT, etc.) o persona que vaya a trabajar sobre esta aplicación. Explica qué es, cómo está construida, dónde vive cada archivo y cómo se actualiza. **Mantener al día** cuando cambie algo estructural.

**Última actualización**: 2026-04-27

---

## 1. Qué es esta app

App web (SPA) interna del recetario de **Casa Amparo 1948** para el equipo de **cocina**. Permite consultar de manera muy visual desde móvil/tablet/ordenador:

- Ingredientes de cada plato (cantidad, UDM, notas)
- Pre-elaboración / Elaboración / Emplatado paso a paso
- Puntos Críticos Gastronómicos (PCG)
- Subrecetas (salsas, bases) con su propia elaboración
- Fotos del plato (lightbox a pantalla completa)
- Alérgenos
- En qué cartas aparece cada plato (Carta Principal / Entrehoras / Menú)

**Lo más importante — qué NO se muestra**: ningún dato económico. Cocina nunca ve costes, PVP, márgenes, utilidades, referencias o precios de proveedor. Eso queda solo en el Excel maestro y en otras herramientas internas.

**Cliente final**: Casa Amparo 1948 (Madrid).
**Desarrollo a cargo de**: Chema González / El Método 360.

---

## 2. URLs y accesos

| Qué | Dónde |
|---|---|
| **App desplegada (producción)** | https://elmetodo360-debug.github.io/casa-amparo-1948/RECETARIO/ |
| **Repositorio GitHub (código)** | https://github.com/elmetodo360-debug/casa-amparo-1948 |
| **Excel maestro (fuente de verdad)** | `H:\Mi unidad\02_Operaciones\FT Casa Amparo v2.xlsx` (Google Drive sincronizado) |
| Hosting | GitHub Pages, rama `master`, servido desde raíz del repo |
| Contraseña del equipo | `CasaAmparo1948` (definida en `app.js`) |

> ⚠️ La contraseña **no es seguridad real**: es JS client-side, cualquiera con conocimientos puede saltársela. Sirve para evitar curiosos casuales. Si necesitamos seguridad de verdad, hay que mover el contenido protegido detrás de un servidor con auth.

---

## 3. Ubicación local

**Raíz del repo en disco**:
```
C:\Users\jmgon\OneDrive - El metodo 360 consultoria Integral S.l\Claude Code\Casa Amparo 1948\
```

**Carpeta de esta app**:
```
C:\Users\jmgon\OneDrive - El metodo 360 consultoria Integral S.l\Claude Code\Casa Amparo 1948\RECETARIO\
```

El repo `casa-amparo-1948` aloja varias apps hermanas (`PEDIDOS/`, `SOAPS/`, `_BBDD/`, `_SHARED/`, `RECETARIO/`). Cada una se publica como subcarpeta de la misma URL de GitHub Pages.

---

## 4. Stack técnico

- **Frontend**: HTML + CSS + **Vanilla JavaScript** (sin frameworks, sin bundler, sin paso de build).
- **Datos**: JSON estático (`data/recetas.json`) + carpeta de imágenes (`data/fotos/`).
- **Generación de datos**: script **Python** (`tools/excel_to_json.py`) que extrae recetas y fotos embebidas del Excel maestro y aplica el filtro económico.
- **Hosting**: GitHub Pages (estático, gratuito).
- **Control de versiones**: Git / GitHub.

**Por qué este stack**: cero infraestructura, cero coste, funciona en cualquier navegador, mismo patrón que las apps hermanas (Checklist Sala, Pedidos). Coherencia y simplicidad por encima de todo.

---

## 5. Estructura de archivos

```
RECETARIO/
├── index.html                ← Shell HTML: login + app + detalle + lightbox
├── app.js                    ← Lógica completa (login, datos, búsqueda, filtros, render)
├── styles.css                ← Estilos completos (mobile-first, dorado/marfil)
├── actualizar.bat            ← Doble-clic: regenera datos + commit + push
├── README.md                 ← Documentación corta de uso
├── MEMORIA-PROYECTO.md       ← Este documento
├── .gitignore
├── data/
│   ├── recetas.json          ← GENERADO por excel_to_json.py — 56 recetas sin €
│   └── fotos/                ← GENERADO — 38 fotos extraídas del Excel
│       ├── albondigas-patatas-fritas.png
│       ├── croquetas-jamon-chips.jpeg
│       └── ...
└── tools/
    └── excel_to_json.py      ← Script de extracción + filtrado económico
```

> Los archivos en `data/` se sobrescriben cada vez que se regenera. **Nunca editar a mano**: se pierden la siguiente vez.

---

## 6. Fuente de datos: el Excel maestro

**Ruta**: `H:\Mi unidad\02_Operaciones\FT Casa Amparo v2.xlsx`

Excel de 61 hojas (~62 MB) con la estructura:

| Tipo de hoja | Cuántas | Contenido |
|---|---|---|
| BBDD ingredientes | 1 (`(aaa) BBDD Ingredientes`) | 1.641 ingredientes con proveedor, formato, precio/UDM, alérgenos |
| Cartas | 3 (`Carta CCA1948`, `Carta Menu CCA1948`, `Carta Entrehoras CCA1948`) | Nombre comercial + descripción + precio público |
| Índice maestro | 1 (`FT Platos CCA1948`) | 64 platos con sección y marcas de en qué carta(s) aparecen |
| Fichas técnicas | 56 (una por plato) | Receta completa con ingredientes, elaboración, PCG, subrecetas, foto, alérgenos, escandallo |

**Estructura tipo de cada FT**:
- Fila 3 col A: Título del plato
- Filas 6–19 cols A–D: Ingredientes (nombre · medida · UDM · notas)
- Fila 6 col E: Texto de elaboración con bloques `PRE ELABORACION` / `ELABORACION` / `EMPLATAMOS`
- Fila 21 col A: Marcador "FOTOGRAFIA" (la foto va embebida cerca de aquí)
- Filas 21–28 col R: Cálculos económicos (Total Coste, PVP, Utilidad, Margen) ← **excluidos del JSON**
- Fila 41 col A: "P.C.G. (PUNTOS CRITICOS GASTRONOMICOS)"
- Fila 42 col A: Texto de PCG con bullets
- Filas 51+ col A: Bloque `SUBRECETA: <nombre> (<código>)` con sus ingredientes y elaboración

---

## 7. Pipeline de actualización

### 7.1 Flujo recomendado (con `actualizar.bat`)

1. Editas el Excel maestro y guardas (Ctrl+S).
2. **Cierras Excel** (importante: el script falla si el archivo está bloqueado).
3. Doble-clic en `actualizar.bat` (carpeta RECETARIO).
4. Esperas el mensaje "LISTO". GitHub Pages republica solo en 1–2 min.

### 7.2 Flujo manual (línea de comandos)

```bash
cd "C:\Users\jmgon\OneDrive - El metodo 360 consultoria Integral S.l\Claude Code\Casa Amparo 1948\RECETARIO"
python tools/excel_to_json.py
cd ..
git add RECETARIO/
git commit -m "Actualizar recetario"
git push
```

### 7.3 Qué hace exactamente `excel_to_json.py`

1. Abre el Excel con `openpyxl` (en modo `data_only=True` para leer valores, no fórmulas).
2. Para cada hoja que NO sea BBDD/cartas/índice:
   - Lee título, ingredientes (cols A–D), elaboración (col E fila 6), PCG (fila 42), subrecetas (filas 51+), alérgenos (col T del espejo de coste).
   - **No lee** las celdas Q–R con costes/PVP/margen — quedan fuera del JSON.
3. Lee el ZIP del .xlsx para extraer las imágenes embebidas:
   - Mapea cada hoja a sus drawings → drawings a sus imágenes.
   - Copia cada imagen a `data/fotos/<slug>.<ext>` con el slug del nombre de la hoja.
4. Cruza cada ficha con `FT Platos CCA1948` por similitud de tokens para asignar sección + cartas.
5. Cruza cada ficha con las 3 hojas de carta para sacar la descripción comercial.
6. Escribe `data/recetas.json` ordenado por sección + nombre.

**Estado conocido (2026-04-27)**: 56 recetas, **38 con foto** (68%), 18 sin foto. Cobertura prevista: 100% cuando se añadan fotos a las hojas marcadas como sin foto.

---

## 8. Filtro económico (lo más crítico de mantener)

| Campo del Excel | ¿Aparece en JSON? | ¿Aparece en app? |
|---|:---:|:---:|
| Nombre del plato | ✅ | ✅ |
| Ingrediente · medida · UDM · notas | ✅ | ✅ |
| Elaboración / PCG / Subrecetas | ✅ | ✅ |
| Foto del plato | ✅ | ✅ |
| Alérgenos | ✅ | ✅ |
| Coste UDM, Coste receta | ❌ | ❌ |
| Total Coste, Cost Ración | ❌ | ❌ |
| PVP, PVP-IVA | ❌ | ❌ |
| Utilidad, Margen | ❌ | ❌ |
| Referencia / precio proveedor | ❌ | ❌ |

**Si en el futuro alguien añade un campo nuevo al Excel, hay que decidir explícitamente si va al JSON o no.** Por defecto, en duda, NO va.

---

## 9. Cómo se editan/añaden cosas en el Excel

| Quiero… | Voy a… | Edito… |
|---|---|---|
| Cambiar gramaje o nota de un ingrediente | Hoja del plato | Cols A–D, fila del ingrediente |
| Cambiar pasos de elaboración | Hoja del plato | Celda E6 (texto largo) |
| Cambiar PCG | Hoja del plato | Celda A42 |
| Añadir foto a un plato | Hoja del plato | Insertar imagen sobre la celda A21 (zona "FOTOGRAFIA") |
| Cambiar nombre comercial del plato | Hojas de carta correspondientes | Columna "Plato" |
| Que aparezca en otra carta | `FT Platos CCA1948` | Marcar X en cols D/E/F |
| Añadir un plato nuevo | Crear hoja copiando la estructura + entrada nueva en `FT Platos CCA1948` | — |

**Importante**: tras cualquier cambio, ejecutar `actualizar.bat` para que se refleje en la app.

---

## 10. Componentes de la app (frontend)

### 10.1 Pantallas
- **Login**: input de contraseña con fondo oscuro, marca "Casa Amparo 1948".
- **Lista**: topbar con buscador + chips de filtro (Carta principal / Entrehoras / Menú + 11 secciones). Cuadrícula de tarjetas con foto, título y sección.
- **Detalle**: foto grande (tap = lightbox), nombre, descripción comercial (de la carta), tags de carta y alérgenos, ingredientes en lista, elaboración en 3 acordeones (PRE/ELAB/MONTAJE), PCG en banda destacada, subrecetas al final.
- **Lightbox**: foto a pantalla completa, tap para cerrar.

### 10.2 Lógica clave (`app.js`)
- Login con `localStorage` (entrada queda recordada en el dispositivo).
- Búsqueda normalizada (sin acentos, sin mayúsculas) sobre nombre, sección, ingredientes y subrecetas.
- Filtros combinables: carta + sección + texto.
- Detalle vinculado al hash de la URL (`#hamburguesa-wagyu-cabra`) → botón Atrás del navegador funciona.

### 10.3 Diseño
- Mobile-first.
- Paleta: marfil (`#faf7f2`), tinta oscura (`#1a1a1a`), dorado (`#d4a373`) — guiño a la identidad clásica del 1948.
- Tipografía: system stack para UI, Georgia (serif) para títulos.

---

## 11. Despliegue (GitHub Pages)

**Configuración** (ya activa, no hay que tocar):
- Repo: `elmetodo360-debug/casa-amparo-1948`
- Source: rama `master`, raíz `/`
- HTTPS forzado
- Build legacy

Cada `git push` a `master` dispara una recompilación automática de Pages. La app está online en ~1–2 minutos.

Para verificar el estado del despliegue:
```bash
gh api repos/elmetodo360-debug/casa-amparo-1948/pages/builds/latest --jq '.status'
```

---

## 12. Pendientes conocidos

1. **18 recetas sin foto** — añadir imagen en su hoja del Excel y regenerar:
   ARROZ BLANCO INFANTIL, BOCATA PIRIPI, CALLOS GARBANZOS SOFRITO, ENSALADILLA BONITO, ENTRECOT TRINCHADO PATATA, HUEVOS FRITOS SALCHICHAS, HUEVOS ROTOS TORREZNOS, MACARRONES INFANTILES TOM, PAN TOSTADO SALMOREJO, PATATAS BRAVAS "BAMBOLEA", PECHUGA POLLO PLANCHA, PEPITO TERNERA AJOS, PAN TETILLA Y PULPO, TABLA CHACINAS CERVECERIA, MN ALCACHOFA BRASA, MN LENTEJAS TRADICIONALES, MN POCHAS ALMEJAS, MN POCHAS GAMBONES.
2. **Mapeo de sección imperfecto en algunas FT** — por ejemplo `BOCATIN CHIPIRONES` se asigna a "Menú — Segundos" cuando debería ser "Entre panes". El algoritmo de matching usa solapamiento de tokens, falla cuando la palabra fuerte coincide con otro plato. Solución: dar más peso a la primera palabra de la hoja, o añadir un mapeo manual `sheet → sección`.
3. **Optimizar fotos a WebP** — actualmente las imágenes pesan ~52 MB en total. Convertir a WebP bajaría a ~12-15 MB y agilizaría la carga en móvil con datos.
4. **Errores económicos del Excel** detectados durante el primer análisis (ojo, esto es del Excel, no de la app): `MN REVUELTO GAMBAS` con margen −102% (coste >PVP, error de gramaje), `PATA PULPO COMPLETA` 22% margen, varios platos con PVP por defecto 18 € cuando la carta marca otro precio. Estos no afectan a la app porque no mostramos €, pero conviene corregirlos en el Excel.

---

## 13. Glosario rápido

- **FT**: Ficha Técnica (= receta con escandallo).
- **PCG**: Puntos Críticos Gastronómicos (puntos de control de calidad en el pase).
- **UDM**: Unidad de Medida.
- **Subreceta**: receta intermedia (salsa, base, masa) usada dentro de una FT principal.
- **Espejo de coste**: el bloque de la derecha de cada hoja FT (cols N–T) donde el chef de costes calcula el escandallo.
- **Carta principal / Entrehoras / Menú**: las 3 ofertas comerciales del restaurante.

---

## 14. Quién contactar

- **Producto / decisiones de negocio**: Chema González (elmetodo360@gmail.com)
- **Desarrollo / mantenimiento**: misma persona (apps creadas con Claude Code)

---

**Si abres este proyecto por primera vez como IA**: lee este documento, después `README.md`, después examina `tools/excel_to_json.py` para entender qué se extrae y `app.js` para entender qué se muestra. La fuente de verdad **siempre** es el Excel — el repo es solo un espejo público filtrado.
