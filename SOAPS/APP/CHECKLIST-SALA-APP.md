# Checklist Diario de Sala - Casa Amparo 1948

## Resumen del proyecto

Aplicacion web (SPA) para el equipo de sala de Casa Amparo 1948. Permite registrar el cumplimiento del checklist diario de apertura y cierre del restaurante. Accesible via QR desde movil.

---

## URLs

- **Web publica:** https://elmetodo360-debug.github.io/checklist-sala-casa-amparo/
- **Repositorio GitHub:** https://github.com/elmetodo360-debug/checklist-sala-casa-amparo
- **Cuenta GitHub:** elmetodo360-debug
- **Hosting:** GitHub Pages (rama master, deploy legacy)

---

## Ubicacion de archivos

```
C:\Users\jmgon\Desktop\Claude Code\
└── Casa Amparo 1948\
    └── SOAPS\
        └── APP\
            ├── CHECKLIST-SALA-APP.md   ← este archivo
            ├── assets\
            │   └── Diseño_borrador.png  ← logo original
            ├── docs\
            │   └── Checklist AyC.xlsx   ← excel fuente del checklist
            └── src\                     ← repo git + GitHub Pages
                ├── index.html           ← app completa (1006 lineas)
                └── logo.png             ← logo usado en la app
```

---

## Stack tecnico

- **Frontend:** HTML + CSS + JavaScript vanilla (sin frameworks)
- **PDF:** jsPDF 2.5.1 (CDN)
- **Captura:** html2canvas 1.4.1 (CDN)
- **Hosting:** GitHub Pages (gratuito)
- **Archivo unico:** Todo en `index.html` (estilos + logica + markup)

---

## Funcionalidades implementadas

1. **Fecha automatica** - Muestra la fecha del dia en espanol
2. **Deteccion L-V / S-D** - Oculta/muestra tareas segun dia de la semana
3. **6 franjas horarias:**
   - APERTURA (18 tareas)
   - 12:00 TRANSICION MEDIODIA (6 tareas, 2 condicionales por dia)
   - 17:00 REPOSICION Y LIMPIEZA TARDE (10 tareas)
   - 20:00 TRANSICION NOCHE (5 tareas)
   - CIERRE (18 tareas + foto Z)
4. **Responsable por franja** - Campo de nombre independiente en cada bloque (puede repetirse)
5. **Progreso visual** - Barra global + contador por franja
6. **Secciones colapsables** - Click en cabecera para expandir/contraer
7. **Foto de la Z** - Input camara/galeria en seccion CIERRE para adjuntar foto del cierre de caja
8. **Notas/incidencias** - Textarea libre al final
9. **Descarga PDF** - Boton flotante genera PDF A4 con:
   - Cabecera con logo + nombre + fecha + tipo de dia
   - Todas las franjas con responsable y estado de cada tarea
   - Foto de la Z si fue adjuntada
   - Notas/incidencias
   - Nombre archivo: `Checklist_Sala_YYYY-MM-DD.pdf`

---

## Diseno visual

- **Colores:**
  - Primario (burdeos): `#5C1A1B`
  - Fondo (crema): `#F5F0E8`
  - Acento (dorado): `#C9A94E`
  - Exito (verde): `#4A7C59`
- **Cada franja tiene gradiente propio:**
  - Apertura: burdeos
  - Mediodia: dorado
  - Tarde: verde
  - Noche: morado
  - Cierre: pizarra oscuro
- **Mobile-first**, max-width 540px en desktop
- **Header sticky** con logo
- **Checkboxes grandes** (28px) para tactil

---

## Tareas del checklist (desde Excel fuente)

### APERTURA
| Zona | Tarea | L-V | S-D |
|------|-------|-----|-----|
| Iluminacion | Encender luces generales del local | Si | Si |
| Iluminacion | Encender lamparas decorativas | Si | Si |
| Iluminacion | Encender luz nevera de tercios | Si | Si |
| Ambiente | Poner musica — Lista "Coff Chill Out" | Si | Si |
| Ambiente | Encender TVs y poner canal de deportes | Si | Si |
| Equipos | Encender vitrina de aperitivos | Si | Si |
| Equipos | Encender vinotecas | Si | Si |
| Equipos | Encender y preparar lavavajillas | Si | Si |
| Equipos | Verificar caja registradora y datafono operativos | Si | Si |
| Barra | Cargar molinillos con cafe | Si | Si |
| Barra | Preparar leches (todos los tipos) en frio | Si | Si |
| Barra | Cortar limones y naranjas | Si | Si |
| Barra | Preparar cubitera de vinos con hielo y agua | Si | Si |
| Sala | Pizarras abiertas — cara de DESAYUNOS | Si | Si |
| Sala | Bolleria colocada encima de la vitrina | Si | Si |
| Sala | Azucareros en todas las mesas | Si | Si |
| Sala | Comprobar servilleteros llenos | Si | Si |
| Aseos | Verificar jabon, papel y papelera vacia en aseos | Si | Si |

### 12:00 — TRANSICION MEDIODIA
| Zona | Tarea | L-V | S-D |
|------|-------|-----|-----|
| Vitrina | Retirar bolleria de la vitrina | Si | Si |
| Vitrina | Colocar aperitivos en la vitrina | Si | Si |
| Sala | Recoger azucareros de las mesas | Si | Si |
| Sala | Voltear pizarras — cara MENU DEL DIA | Si | No |
| Sala | Sabados y Domingos: recoger pizarras | No | Si |
| Barra | Reponer vasos y tazas limpios en barra | Si | Si |

### 17:00 — REPOSICION Y LIMPIEZA TARDE
| Zona | Tarea | L-V | S-D |
|------|-------|-----|-----|
| Equipos | Cambiar agua del lavavajillas | Si | Si |
| Barra | Cambiar hielo y agua de cubitera de vinos | Si | Si |
| Barra | Rellenar nevera de tercios | Si | Si |
| Barra | Rellenar refrescos | Si | Si |
| Vitrina | Volver a sacar la bolleria a la vitrina | Si | Si |
| Sala | Repasar cubiertos (limpios y ordenados) | Si | Si |
| Sala | Brillar copas (sin marcas ni manchas) | Si | Si |
| Limpieza | Barrer salon, terraza y comedor | Si | Si |
| Aseos | Repasar aseos: jabon, papel, papelera, suelo | Si | Si |
| Barra | Reponer pajitas, posavasos y removedores | Si | Si |

### 20:00 — TRANSICION NOCHE
| Zona | Tarea | L-V | S-D |
|------|-------|-----|-----|
| Vitrina | Retirar bolleria de la vitrina | Si | Si |
| Vitrina | Reponer aperitivos en la vitrina si hace falta | Si | Si |
| Barra | Repasar limones/naranjas — cortar mas si es necesario | Si | Si |
| Barra | Rellenar nevera de tercios si hace falta | Si | Si |
| Ambiente | Ajustar volumen musica e iluminacion para ambiente nocturno | Si | Si |

### CIERRE
| Zona | Tarea | L-V | S-D |
|------|-------|-----|-----|
| Barra | Rellenar TODAS las camaras (tercios, refrescos, cervezas) | Si | Si |
| Barra | Vaciar cubitera de vinos (hielo y agua) | Si | Si |
| Barra | Limpiar y secar barra completa | Si | Si |
| Sala | Azucareros colocados en todas las mesas | Si | Si |
| Sala | Servilleteros recargados en todas las mesas | Si | Si |
| Limpieza | Barrer y fregar salon, terraza y comedor | Si | Si |
| Limpieza | Vaciar papeleras y cubos de basura | Si | Si |
| Equipos | Apagar vitrina de aperitivos | Si | Si |
| Equipos | Apagar luz nevera de tercios | Si | Si |
| Equipos | Apagar vinotecas | Si | Si |
| Equipos | Apagar lavavajillas (vaciar filtros si toca) | Si | Si |
| Equipos | Apagar TVs | Si | Si |
| Equipos | Apagar musica | Si | Si |
| Iluminacion | Apagar lamparas decorativas | Si | Si |
| Iluminacion | Apagar luces generales | Si | Si |
| Caja | Cuadrar caja y cerrar datafono | Si | Si |
| Seguridad | Cerrar grifos, gas y verificar puertas/ventanas | Si | Si |
| Seguridad | Activar alarma y cerrar local | Si | Si |
| **FOTO Z** | Adjuntar foto del cierre de caja | Si | Si |

---

## Como modificar y desplegar cambios

1. Editar `index.html` en `C:\Users\jmgon\Desktop\Claude Code\Casa Amparo 1948\SOAPS\APP\src\`
2. Desde esa carpeta ejecutar:
   ```bash
   git add -A
   git commit -m "descripcion del cambio"
   git push
   ```
3. En 1-2 minutos la web se actualiza automaticamente en la misma URL
4. El QR sigue funcionando sin cambios

---

## Posibles mejoras futuras

- Envio automatico del PDF por email/WhatsApp al cierre
- Login de usuarios / roles (equipo vs direccion)
- Historial de checklists completados
- Dashboard para direccion con estadisticas
- Modo offline (Service Worker / PWA)
- Notificaciones push en cada franja horaria
- Inventario rapido integrado
- Firma digital del responsable

---

## Fecha de creacion

11 de abril de 2026
