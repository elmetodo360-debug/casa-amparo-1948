"""
SETUP AUTOMATIZADO - Casa Amparo 1948
=====================================
Este script:
1. Autentica con tu cuenta de Google
2. Crea el Google Sheet en tu Drive con todos los productos
3. Crea las pestañas: PRODUCTOS, PROVEEDORES, CONFIG
4. Devuelve el ID del Sheet para configurar la app

Uso: python setup.py
"""

import json
import os
import sys
import time

# --- Google imports ---
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PRODUCTOS_JSON = os.path.join(SCRIPT_DIR, '..', 'PEDIDOS', 'APP', 'src', 'productos.json')
TOKEN_PATH = os.path.join(SCRIPT_DIR, 'token.json')
CREDENTIALS_PATH = os.path.join(SCRIPT_DIR, 'credentials.json')
SHEET_INFO_PATH = os.path.join(SCRIPT_DIR, 'sheet_info.json')

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/script.projects',
]

def get_credentials():
    """Authenticate with Google. Creates token.json for future use."""
    creds = None

    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_PATH):
                print("\n" + "=" * 60)
                print("PASO PREVIO: Crear credenciales de Google")
                print("=" * 60)
                print("""
Para que este script pueda crear el Google Sheet en tu Drive,
necesitas crear unas credenciales OAuth (solo 1 vez):

1. Ve a: https://console.cloud.google.com/
2. Crea un proyecto nuevo: "Casa Amparo 1948"
3. Ve a "APIs y servicios" > "Biblioteca"
4. Activa: "Google Sheets API" y "Google Drive API"
5. Ve a "APIs y servicios" > "Credenciales"
6. Click "Crear credenciales" > "ID de cliente OAuth"
7. Tipo: "Aplicación de escritorio"
8. Nombre: "Casa Amparo Setup"
9. Descarga el JSON y guárdalo como:
   {}

Después vuelve a ejecutar este script.
""".format(CREDENTIALS_PATH))
                sys.exit(1)

            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())

    return creds


def create_spreadsheet(creds):
    """Create the master Google Sheet with all tabs."""
    service = build('sheets', 'v4', credentials=creds)

    # Load products
    with open(PRODUCTOS_JSON, 'r', encoding='utf-8') as f:
        productos = json.load(f)

    # Deduplicate and sort
    seen = set()
    unique = []
    for p in productos:
        key = (p.get('proveedor', ''), p.get('codigo', ''), p.get('producto', ''))
        if key not in seen:
            seen.add(key)
            unique.append(p)
    unique.sort(key=lambda x: (x.get('proveedor', ''), x.get('categoria', ''), x.get('producto', '')))

    print(f"Productos únicos: {len(unique)}")

    # ---- CREATE SPREADSHEET ----
    spreadsheet = service.spreadsheets().create(body={
        'properties': {'title': 'Casa Amparo 1948 - BBDD Maestro'},
        'sheets': [
            {'properties': {'title': 'PRODUCTOS', 'gridProperties': {'rowCount': 2000, 'frozenRowCount': 1, 'frozenColumnCount': 1}}},
            {'properties': {'title': 'PROVEEDORES', 'gridProperties': {'frozenRowCount': 1}}},
            {'properties': {'title': 'CONFIG', 'gridProperties': {'frozenRowCount': 1}}},
        ]
    }).execute()

    sheet_id = spreadsheet['spreadsheetId']
    sheet_url = spreadsheet['spreadsheetUrl']
    print(f"\nGoogle Sheet creado: {sheet_url}")

    # ---- FILL PRODUCTOS ----
    print("Rellenando PRODUCTOS...")
    headers = ['Proveedor', 'Categoría', 'Código', 'Producto', 'Precio', 'Unidad', 'IVA', 'Stock Mínimo']
    rows = [headers]
    for p in unique:
        precio = p.get('precio')
        if precio is None:
            precio = ''
        rows.append([
            p.get('proveedor', ''),
            p.get('categoria', ''),
            str(p.get('codigo', '')),
            p.get('producto', ''),
            precio,
            p.get('unidad', ''),
            p.get('iva', ''),
            0  # Stock mínimo default
        ])

    # Write in batches of 500
    for i in range(0, len(rows), 500):
        batch = rows[i:i+500]
        start_row = i + 1
        end_row = start_row + len(batch) - 1
        service.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range=f'PRODUCTOS!A{start_row}:H{end_row}',
            valueInputOption='RAW',
            body={'values': batch}
        ).execute()
        print(f"  Escritas filas {start_row}-{end_row}")
        time.sleep(0.5)

    # ---- FILL PROVEEDORES ----
    print("Rellenando PROVEEDORES...")
    proveedores = sorted(set(p.get('proveedor', '') for p in unique if p.get('proveedor')))
    prov_rows = [['Nombre', 'Contacto', 'Teléfono', 'Email', 'Día Pedido', 'Pedido Mínimo', 'Notas']]
    for prov in proveedores:
        prov_rows.append([prov, '', '', '', '', '', ''])

    # Add known data
    prov_data = {
        'Oido Cocina Gourmet': ['Pablo Salvador', '659 289 506', 'info@oidococinagourmet.com', 'Jueves', '4 bolsas 2kg', ''],
    }
    for i, row in enumerate(prov_rows[1:], 1):
        if row[0] in prov_data:
            data = prov_data[row[0]]
            prov_rows[i] = [row[0]] + data

    service.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range=f'PROVEEDORES!A1:G{len(prov_rows)}',
        valueInputOption='RAW',
        body={'values': prov_rows}
    ).execute()

    # ---- FILL CONFIG ----
    print("Rellenando CONFIG...")
    config_rows = [
        ['Clave', 'Valor', 'Descripción'],
        ['nombre_negocio', 'Casa Amparo 1948', 'Nombre en PDFs y app'],
        ['subtitulo', 'Control de Inventario', 'Subtítulo de la app'],
        ['moneda', '€', 'Símbolo de moneda'],
        ['zona_horaria', 'Europe/Madrid', 'Zona horaria para registros'],
        ['version', '1.0', 'Versión de la BBDD'],
    ]

    service.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range=f'CONFIG!A1:C{len(config_rows)}',
        valueInputOption='RAW',
        body={'values': config_rows}
    ).execute()

    # ---- FORMAT HEADERS ----
    print("Aplicando formato...")
    sheets_meta = spreadsheet['sheets']
    sheet_ids = {s['properties']['title']: s['properties']['sheetId'] for s in sheets_meta}

    requests = []
    for title, sid in sheet_ids.items():
        # Header format
        requests.append({
            'repeatCell': {
                'range': {'sheetId': sid, 'startRowIndex': 0, 'endRowIndex': 1},
                'cell': {
                    'userEnteredFormat': {
                        'backgroundColor': {'red': 0.17, 'green': 0.09, 'blue': 0.06},
                        'textFormat': {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}, 'bold': True, 'fontSize': 11},
                        'horizontalAlignment': 'CENTER'
                    }
                },
                'fields': 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
        })

    # Stock Mínimo column highlight (column H = index 7)
    requests.append({
        'repeatCell': {
            'range': {'sheetId': sheet_ids['PRODUCTOS'], 'startRowIndex': 1, 'startColumnIndex': 7, 'endColumnIndex': 8},
            'cell': {
                'userEnteredFormat': {
                    'backgroundColor': {'red': 1, 'green': 0.95, 'blue': 0.88},
                    'textFormat': {'bold': True, 'fontSize': 12, 'foregroundColor': {'red': 0.9, 'green': 0.32, 'blue': 0}},
                    'horizontalAlignment': 'CENTER'
                }
            },
            'fields': 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
    })

    # Column widths for PRODUCTOS
    col_widths = [200, 180, 100, 350, 90, 90, 60, 120]
    for i, w in enumerate(col_widths):
        requests.append({
            'updateDimensionProperties': {
                'range': {'sheetId': sheet_ids['PRODUCTOS'], 'dimension': 'COLUMNS', 'startIndex': i, 'endIndex': i + 1},
                'properties': {'pixelSize': w},
                'fields': 'pixelSize'
            }
        })

    service.spreadsheets().batchUpdate(spreadsheetId=sheet_id, body={'requests': requests}).execute()

    # ---- SAVE SHEET INFO ----
    info = {
        'sheet_id': sheet_id,
        'sheet_url': sheet_url,
        'created': time.strftime('%Y-%m-%d %H:%M:%S'),
        'productos_count': len(unique),
        'proveedores_count': len(proveedores)
    }

    with open(SHEET_INFO_PATH, 'w') as f:
        json.dump(info, f, indent=2)

    return info


def move_to_folder(creds, file_id):
    """Optionally move to a specific folder - we'll skip this for now."""
    pass


def main():
    print("=" * 60)
    print("  SETUP CASA AMPARO 1948 - BBDD en Google Sheets")
    print("=" * 60)

    print("\n[1/3] Autenticando con Google...")
    creds = get_credentials()
    print("  OK - Autenticado correctamente")

    print("\n[2/3] Creando Google Sheet con todos los datos...")
    info = create_spreadsheet(creds)

    print("\n[3/3] Configuración guardada")
    print("\n" + "=" * 60)
    print("  SETUP COMPLETADO")
    print("=" * 60)
    print(f"""
  Sheet URL: {info['sheet_url']}
  Sheet ID:  {info['sheet_id']}
  Productos: {info['productos_count']}
  Proveedores: {info['proveedores_count']}

  SIGUIENTE PASO:
  1. Abre el Sheet en tu navegador
  2. Ve a Extensiones > Apps Script
  3. Pega el contenido de: apps-script/Code.gs
  4. Implementar > Nueva implementación > App web
     - Ejecutar como: Yo
     - Acceso: Cualquier persona
  5. Copia la URL y dámela

  (Estoy preparando un script para automatizar
   también el paso del Apps Script)
""")


if __name__ == '__main__':
    main()
