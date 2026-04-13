function doGet(e) {
  var action = e.parameter.action;

  try {
    if (action === 'getProductos') {
      return jsonResponse(getProductos());
    } else if (action === 'getProveedores') {
      return jsonResponse(getProveedores());
    } else if (action === 'getConfig') {
      return jsonResponse(getConfig());
    } else if (action === 'getHistorico') {
      var dias = parseInt(e.parameter.dias) || 7;
      return jsonResponse(getHistorico(dias));
    } else if (action === 'getPedidosPendientes') {
      return jsonResponse(getPedidosPendientes());
    } else if (action === 'getUltimoInventario') {
      return jsonResponse(getUltimoInventario());
    } else {
      return jsonResponse({ error: 'Accion no reconocida' });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action;

  try {
    if (action === 'guardarInventario') {
      return jsonResponse(guardarInventario(data));
    } else if (action === 'marcarPedidoEnviado') {
      return jsonResponse(marcarPedidoEnviado(data));
    } else {
      return jsonResponse({ error: 'Accion no reconocida' });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getProductos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('PRODUCTOS');
  var data = ws.getDataRange().getValues();
  var productos = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[3]) continue;

    productos.push({
      proveedor: row[0] || '',
      categoria: row[1] || '',
      codigo: row[2] || '',
      producto: row[3] || '',
      precio: row[4] || 0,
      unidad: row[5] || '',
      iva: row[6] || '',
      stockMinimo: row[7] || 0,
      fila: i + 1
    });
  }

  return { productos: productos };
}

function getProveedores() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('PROVEEDORES');

  if (!ws) return { proveedores: [] };

  var data = ws.getDataRange().getValues();
  var proveedores = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;

    proveedores.push({
      nombre: row[0],
      contacto: row[1] || '',
      telefono: row[2] || '',
      email: row[3] || '',
      diaPedido: row[4] || '',
      notas: row[5] || ''
    });
  }

  return { proveedores: proveedores };
}

function getConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('CONFIG');

  if (!ws) return { config: {} };

  var data = ws.getDataRange().getValues();
  var config = {};

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      config[data[i][0]] = data[i][1];
    }
  }

  return { config: config };
}

function guardarInventario(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('INVENTARIO_DIARIO');

  if (!ws) {
    ws = ss.insertSheet('INVENTARIO_DIARIO');
    ws.appendRow(['Fecha', 'Hora', 'Usuario', 'Proveedor', 'Codigo', 'Producto', 'Unidad', 'Stock Actual', 'Stock Minimo', 'Diferencia', 'Necesita Pedir']);
    ws.getRange(1, 1, 1, 11).setFontWeight('bold');
  }

  var fecha = new Date();
  var fechaStr = Utilities.formatDate(fecha, 'Europe/Madrid', 'dd/MM/yyyy');
  var horaStr = Utilities.formatDate(fecha, 'Europe/Madrid', 'HH:mm');
  var usuario = data.usuario || 'Sin identificar';
  var items = data.items || [];

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var diferencia = item.stockActual - item.stockMinimo;
    var necesitaPedir = diferencia < 0 ? 'SI' : 'NO';

    rows.push([
      fechaStr,
      horaStr,
      usuario,
      item.proveedor,
      item.codigo,
      item.producto,
      item.unidad,
      item.stockActual,
      item.stockMinimo,
      diferencia,
      necesitaPedir
    ]);
  }

  if (rows.length > 0) {
    ws.getRange(ws.getLastRow() + 1, 1, rows.length, 11).setValues(rows);
  }

  actualizarPedidosSugeridos(items, fechaStr, horaStr, usuario);

  return {
    ok: true,
    mensaje: rows.length + ' productos registrados',
    fecha: fechaStr,
    hora: horaStr
  };
}

function actualizarPedidosSugeridos(items, fechaStr, horaStr, usuario) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('PEDIDOS_SUGERIDOS');

  if (!ws) {
    ws = ss.insertSheet('PEDIDOS_SUGERIDOS');
    ws.appendRow(['Fecha Inventario', 'Hora', 'Usuario', 'Proveedor', 'Codigo', 'Producto', 'Unidad', 'Stock Actual', 'Stock Minimo', 'Cantidad a Pedir', 'Estado']);
    ws.getRange(1, 1, 1, 11).setFontWeight('bold');
  }

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (item.stockActual < item.stockMinimo) {
      var cantidadPedir = item.stockMinimo - item.stockActual;
      rows.push([
        fechaStr,
        horaStr,
        usuario,
        item.proveedor,
        item.codigo,
        item.producto,
        item.unidad,
        item.stockActual,
        item.stockMinimo,
        cantidadPedir,
        'PENDIENTE'
      ]);
    }
  }

  if (rows.length > 0) {
    ws.getRange(ws.getLastRow() + 1, 1, rows.length, 11).setValues(rows);
  }
}

function getHistorico(dias) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('INVENTARIO_DIARIO');

  if (!ws || ws.getLastRow() < 2) {
    return { registros: [] };
  }

  var data = ws.getDataRange().getValues();
  var hoy = new Date();
  var limite = new Date(hoy.getTime() - (dias * 24 * 60 * 60 * 1000));

  var registros = [];
  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    var parts = String(row[0]).split('/');
    if (parts.length === 3) {
      var fecha = new Date(parts[2], parts[1] - 1, parts[0]);
      if (fecha < limite) break;
    }

    registros.push({
      fecha: row[0],
      hora: row[1],
      usuario: row[2],
      proveedor: row[3],
      codigo: row[4],
      producto: row[5],
      unidad: row[6],
      stockActual: row[7],
      stockMinimo: row[8],
      diferencia: row[9],
      necesitaPedir: row[10]
    });
  }

  return { registros: registros };
}

function getPedidosPendientes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('PEDIDOS_SUGERIDOS');

  if (!ws || ws.getLastRow() < 2) {
    return { pedidos: [] };
  }

  var data = ws.getDataRange().getValues();
  var pedidos = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[10] === 'PENDIENTE') {
      pedidos.push({
        fila: i + 1,
        fecha: row[0],
        hora: row[1],
        usuario: row[2],
        proveedor: row[3],
        codigo: row[4],
        producto: row[5],
        unidad: row[6],
        stockActual: row[7],
        stockMinimo: row[8],
        cantidadPedir: row[9],
        estado: row[10]
      });
    }
  }

  return { pedidos: pedidos };
}

function marcarPedidoEnviado(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('PEDIDOS_SUGERIDOS');

  if (!ws) return { error: 'No existe la hoja PEDIDOS_SUGERIDOS' };

  var filas = data.filas || [];
  for (var i = 0; i < filas.length; i++) {
    ws.getRange(filas[i], 11).setValue('ENVIADO');
  }

  return { ok: true, mensaje: filas.length + ' pedidos marcados como enviados' };
}

function getUltimoInventario() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ws = ss.getSheetByName('INVENTARIO_DIARIO');

  if (!ws || ws.getLastRow() < 2) {
    return { inventario: [], fecha: null };
  }

  var data = ws.getDataRange().getValues();
  var ultimaFecha = data[data.length - 1][0];

  var inventario = [];
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][0] !== ultimaFecha) break;
    inventario.push({
      codigo: data[i][4],
      producto: data[i][5],
      stockActual: data[i][7]
    });
  }

  return { inventario: inventario, fecha: ultimaFecha };
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
