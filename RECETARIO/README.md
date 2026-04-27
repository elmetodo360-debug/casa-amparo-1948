# Recetario · Casa Amparo 1948

App web del recetario interno para el equipo de cocina. Solo recetas, ingredientes, montaje y fotos — sin escandallos ni datos económicos.

## URL

Tras desplegar en GitHub Pages: `https://<usuario>.github.io/cca1948-recetario/`

Contraseña del equipo: **CasaAmparo1948**

## Cómo actualizar las recetas

1. Editar el Excel maestro en su ubicación habitual:
   `H:\Mi unidad\02_Operaciones\FT Casa Amparo v2.xlsx`
2. Regenerar los datos:
   ```bash
   python tools/excel_to_json.py
   ```
   Esto reconstruye `data/recetas.json` y `data/fotos/`.
3. Subir cambios:
   ```bash
   git add -A
   git commit -m "Actualización recetas"
   git push
   ```

GitHub Pages publica automáticamente en 1–2 minutos.

## Estructura

```
RECETARIO/
├── index.html           SPA
├── app.js               buscador, filtros, render
├── styles.css           estilos
├── data/
│   ├── recetas.json     generado desde Excel (sin €)
│   └── fotos/           imágenes extraídas del Excel
└── tools/
    └── excel_to_json.py script de extracción
```

## Qué se muestra

- Nombre, sección, carta(s) en las que aparece
- Ingredientes (cantidad, UDM, notas)
- Pre-elaboración / Elaboración / Emplatado
- Puntos Críticos Gastronómicos
- Subrecetas con ingredientes y elaboración
- Foto grande del plato (ampliable a pantalla completa)
- Alérgenos

## Qué se filtra (oculto al equipo)

- Coste por unidad y por receta
- PVP, IVA, utilidad, margen
- Referencias y precios de proveedor
