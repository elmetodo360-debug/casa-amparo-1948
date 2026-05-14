# App Eventos · Casa Amparo 1948

SPA para presupuestar y operar eventos: calculadoras de personal, bebida y comida + escandallo total + generadores de Orden de Servicio y Orden de Compra.

**Versión:** v1.0 (Sprints 1-9 completados)
**Drive de datos:** [App_Eventos_CasaAmparo_DATOS](https://docs.google.com/spreadsheets/d/19afBt9sumS9MJ0OJ0pN7eLW_eJKzzn8qihN9NyP1yFQ/edit)

## Stack

- **Frontend:** Vanilla JS + Tailwind CSS (CDN)
- **Hosting:** GitHub Pages (mismo monorepo `casa-amparo-1948`)
- **Backend de datos:** Google Sheet `App_Eventos_CasaAmparo_DATOS` (8 pestañas) publicado como CSV por pestaña
- **Persistencia eventos:** localStorage (sin auth)
- **Sin build tools:** edita y refresca

## Estructura

```
EVENTOS/APP/
├── src/
│   ├── index.html
│   ├── styles.css                ← incluye CSS @media print
│   ├── data/
│   │   └── sheet-config.json     ← URLs publicadas de cada pestaña
│   └── js/
│       ├── utils.js              ← helpers (€, parser EU, escape)
│       ├── csv-parser.js         ← parser CSV (auto-detecta ; o ,)
│       ├── state.js              ← localStorage helpers
│       ├── data-loader.js        ← carga 8 pestañas en paralelo
│       ├── wizard.js             ← formulario nuevo evento
│       ├── eventos.js            ← lista eventos guardados
│       ├── calc-personal.js      ← Sprint 3
│       ├── calc-bebida.js        ← Sprint 4
│       ├── calc-comida.js        ← Sprint 5
│       ├── calc-escandallo.js    ← Sprint 6 (suma + PVP + margen + food cost)
│       ├── gen-orden-servicio.js ← Sprint 7 (cronograma + equipo)
│       ├── gen-orden-compra.js   ← Sprint 8 (lista compra agrupada)
│       ├── calculo.js            ← controlador vista #calculo con tabs
│       └── app.js                ← bootstrap + routing por hash
└── docs/
    └── README.md                 ← este archivo
```

## Estado de sprints

- [x] **Sprint 1** — Scaffolding + capa de datos (lectura CSV del Sheet, verificación visual)
- [x] **Sprint 2** — Wizard configuración cóctel + lista eventos guardados (localStorage)
- [x] **Sprint 2.1** — Wizard adaptativo: 5 tipos de evento habilitados (cóctel · menú sentado · coffee break · brasas · arroces). Personal y PVP cliente calculan para todos. Comida pendiente para no-cóctel hasta cerrar escandallos cocina.
- [x] **Sprint 3** — Calculadora de Personal (ratios MIKE + tarifas CA + horas facturadas + estaciones)
- [x] **Sprint 4** — Calculadora de Bebida (envases a comprar; barra Silver/Gold como paquete)
- [x] **Sprint 5** — Calculadora de Comida (canapés frío/caliente/postre + signatures + descuento por estaciones)
- [x] **Sprint 6** — Escandallo total + PVP + margen + food cost real con semáforo
- [x] **Sprint 7** — Generador Orden de Servicio (cronograma + equipo + imprimible)
- [x] **Sprint 8** — Generador Orden de Compra (cocina + bebida + estaciones + imprimible)
- [x] **Sprint 9** — Polish + CSS @media print + README final

## Cómo arranca un evento

1. **Nuevo evento** (#wizard): rellena form (cliente, fecha, pax, pack cóctel, signatures, estaciones, etc.) → Guardar.
2. **Eventos guardados** (#eventos): ve la lista, click en **Calcular**.
3. **Calculadora** (#calculo/ev_XXX): tabs por sección
   - Escandallo + PVP (vista por defecto)
   - Personal · Bebida · Comida (desglose)
   - Orden de Servicio · Orden de Compra (imprimibles con botón)

## Routing

```
#wizard                          ← Nuevo evento (default)
#eventos                         ← Lista de eventos guardados
#datos                           ← Verificación capa de datos
#calculo/ev_XXX                  ← Calculadora del evento (tab default: escandallo)
#calculo/ev_XXX/personal
#calculo/ev_XXX/bebida
#calculo/ev_XXX/comida
#calculo/ev_XXX/escandallo
#calculo/ev_XXX/orden_servicio
#calculo/ev_XXX/orden_compra
```

## Arrancar local

```bash
cd src
python -m http.server 8000
```

Abrir `http://localhost:8000` (no abrir con `file://`, fetch() no funciona).

## Deploy a GitHub Pages

El monorepo está en `github.com/elmetodo360/casa-amparo-1948.git`. Para deploy:

```bash
cd "C:\Users\jmgon\OneDrive - El metodo 360 consultoria Integral S.l\Claude Code\Casa Amparo 1948"
git add EVENTOS/
git commit -m "App Eventos: scaffolding completo Sprints 1-9"
git push
```

Después, en GitHub → Settings → Pages → asegurar que sirve la rama `master` desde `/` o configurar custom action si ya hay otra app en pages. URL final: `https://elmetodo360.github.io/casa-amparo-1948/EVENTOS/APP/src/`.

## Limitaciones conocidas (v1.0)

- Solo soporta tipo `coctel` (los otros tipos están en el wizard pero deshabilitados hasta Sprint 2.1).
- **Coste de bebida no calculado** — el Sheet no tiene catálogo de costes de bebida por envase. La calculadora solo da CANTIDADES a comprar. Para añadir costes: crear pestaña `Bebida_Costes` con `categoria,envase,coste_envase` y actualizar `calc-bebida.js`.
- **Composición concreta de canapés no editable** — la app usa el coste medio de fríos/calientes base. Para precisión total, en Sprint 2.1 se podría añadir UI para que el cliente elija exactamente qué piezas quiere.
- **Orden de compra no agrupa por proveedor** — falta catálogo de proveedores por canapé. Por ahora agrupa por categoría operativa.
- **Hora de inicio del evento hardcodeada a 20:00** en Orden de Servicio. En siguiente versión añadir campo `hora_inicio` al wizard.
- **Sin login / multi-usuario** — los eventos guardados viven en localStorage del navegador. Cambias de equipo o borras caché → desaparecen.

## Cuando se cierren los escandallos pendientes (Cocina CA)

- Menús sentados (35 componentes)
- Coffee breaks (17 componentes)
- Brasas y Arroces (8 componentes)
- Estaciones showcooking (12 costes/estación)

→ Habilitar las opciones del select `tipo_evento` en `index.html` y crear/extender los módulos calc-* con la lógica para esos tipos.

## Migración a Drive Casa Amparo

Cuando se decida:
1. Mover carpeta del Sheet en Drive (clic-derecho en `App_Eventos_CasaAmparo` → Mover → seleccionar Drive CA).
2. El ID del Sheet **no cambia** al mover entre Drives → la app sigue funcionando sin tocar nada.
3. Si se decide cambiar de Sheet (otro nuevo en Drive CA), actualizar `sheet_id` y las 8 URLs en `src/data/sheet-config.json`.

## Referencias

- Documento canonical del proyecto (memoria MIKE): `C:\Users\jmgon\Downloads\App_Eventos_CasaAmparo_README.md`
- Carpeta Drive: https://drive.google.com/drive/folders/1BH1w3YyO3lF08-coOfgUDi27AeX8Se8B
- Sheet de datos: https://docs.google.com/spreadsheets/d/19afBt9sumS9MJ0OJ0pN7eLW_eJKzzn8qihN9NyP1yFQ/edit
