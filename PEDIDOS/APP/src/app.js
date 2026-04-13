// ============================================================
// CASA AMPARO 1948 - App de Inventario
// ============================================================

let productos = [];
let inventario = {}; // { index: cantidad que HAY }
let usuarioActual = '';
let modoAdmin = false;
let usandoAPI = false;

// --- INIT ---

async function init() {
    // Try to load from Google Sheets API first, fallback to local JSON
    try {
        if (typeof CONFIG_CASA_AMPARO !== 'undefined' && CONFIG_CASA_AMPARO.API_URL !== 'PEGA_AQUI_LA_URL_DEL_APPS_SCRIPT') {
            usandoAPI = true;
        }
    } catch (e) {
        usandoAPI = false;
    }
}

async function entrar() {
    const select = document.getElementById('input-usuario');
    const usuario = select.value.trim();
    if (!usuario) {
        showToast('Selecciona tu nombre');
        return;
    }

    usuarioActual = usuario;
    document.getElementById('login-estado').textContent = 'Cargando productos...';

    try {
        await cargarProductos();
        document.getElementById('pantalla-login').classList.add('hidden');
        document.getElementById('app-principal').classList.remove('hidden');
        document.getElementById('header-subtitle').textContent = `Inventario · ${usuarioActual}`;

        // Only show admin button for Chema
        if (usuarioActual !== 'Chema') {
            document.getElementById('btn-modo').classList.add('hidden');
        }

        loadInventario();
        renderTabs();
        renderPanel(0);
        updateBadge();
    } catch (err) {
        document.getElementById('login-estado').textContent = 'Error al cargar: ' + err.message;
        console.error(err);
    }
}

async function cargarProductos() {
    if (usandoAPI) {
        showLoading('Conectando con Google Sheets...');
        const resp = await fetch(CONFIG_CASA_AMPARO.API_URL + '?action=getProductos');
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        productos = data.productos;
        hideLoading();
    } else {
        // Fallback: local JSON
        const resp = await fetch('src/productos.json');
        const raw = await resp.json();
        // Add stockMinimo = 0 if not present
        productos = raw.map(p => ({ ...p, stockMinimo: p.stockMinimo || 0 }));
    }
}

// --- PROVEEDORES Y TABS ---

function getProveedores() {
    const seen = [];
    productos.forEach(p => {
        if (!seen.includes(p.proveedor)) seen.push(p.proveedor);
    });
    return seen;
}

function renderTabs() {
    const nav = document.getElementById('tabs-nav');
    const proveedores = getProveedores();

    nav.innerHTML = `
        <div class="proveedor-selector">
            <select id="select-proveedor" class="select-proveedor" onchange="switchTab(this.value)">
                ${proveedores.map((prov, i) => {
                    const items = productos.filter(p => p.proveedor === prov);
                    const count = items.length;
                    const filled = items.filter((p) => {
                        const idx = productos.indexOf(p);
                        return inventario[idx] > 0;
                    }).length;
                    const shortName = prov.replace(/\s*\(.*\)/, '');
                    return `<option value="${i}">${shortName} (${filled}/${count})</option>`;
                }).join('')}
            </select>
            <div class="selector-arrows">
                <button class="arrow-btn" onclick="prevProveedor()">&lsaquo;</button>
                <span class="selector-pos" id="selector-pos">1/${proveedores.length}</span>
                <button class="arrow-btn" onclick="nextProveedor()">&rsaquo;</button>
            </div>
        </div>
    `;
}

function switchTab(index) {
    index = parseInt(index);
    const select = document.getElementById('select-proveedor');
    if (select) select.value = index;
    updateSelectorPos(index);
    renderPanel(index);
}

function prevProveedor() {
    const select = document.getElementById('select-proveedor');
    const current = parseInt(select.value);
    const total = getProveedores().length;
    const prev = current > 0 ? current - 1 : total - 1;
    switchTab(prev);
}

function nextProveedor() {
    const select = document.getElementById('select-proveedor');
    const current = parseInt(select.value);
    const total = getProveedores().length;
    const next = current < total - 1 ? current + 1 : 0;
    switchTab(next);
}

function updateSelectorPos(index) {
    const pos = document.getElementById('selector-pos');
    if (pos) pos.textContent = `${index + 1}/${getProveedores().length}`;
}

// --- PANEL DE PRODUCTOS ---

function renderPanel(tabIndex) {
    const main = document.getElementById('main-content');
    const proveedores = getProveedores();
    const prov = proveedores[tabIndex];
    const items = productos.filter(p => p.proveedor === prov);

    const categorias = [];
    items.forEach(item => {
        if (!categorias.includes(item.categoria)) categorias.push(item.categoria);
    });

    const provEscaped = prov.replace(/'/g, "\\'");

    let html = `
        <div class="panel-top-bar">
            <div class="search-bar">
                <input type="text" class="search-input" placeholder="Buscar en ${prov}..." oninput="filterProducts(this.value)">
            </div>
            <button class="btn-pdf-proveedor" onclick="descargarPDFProveedor('${provEscaped}')">
                PDF ${prov.replace(/\s*\(.*\)/, '')}
            </button>
        </div>
    `;

    categorias.forEach(cat => {
        const catItems = items.filter(i => i.categoria === cat);
        html += `
            <div class="category-section" data-cat="${cat}">
                <div class="category-header">${cat}</div>
                <div class="product-list">
                    ${catItems.map(item => {
                        const idx = productos.indexOf(item);
                        const qty = inventario[idx] || 0;
                        const stockMin = item.stockMinimo || 0;
                        const precio = item.precio;
                        const precioStr = typeof precio === 'number' ? precio.toFixed(2).replace('.', ',') + ' \u20AC' : 'S/P';

                        // Status: green if stock >= min, orange if below, red if 0
                        let statusClass = '';
                        if (qty > 0 && qty >= stockMin) statusClass = 'stock-ok';
                        else if (qty > 0 && qty < stockMin) statusClass = 'stock-bajo';
                        else if (stockMin > 0 && qty === 0) statusClass = 'stock-critico';

                        return `
                            <div class="product-row ${qty > 0 ? 'has-qty' : ''} ${statusClass}" id="row-${idx}">
                                <div class="product-info">
                                    <div class="product-name">${item.producto}</div>
                                    <div class="product-meta">
                                        ${item.codigo ? `<span class="product-code">${item.codigo}</span> ` : ''}
                                        ${item.unidad || ''} &middot; IVA ${item.iva}
                                        ${stockMin > 0 ? ` &middot; <span class="stock-min-label">Min: ${stockMin}</span>` : ''}
                                    </div>
                                </div>
                                <div class="product-price">
                                    ${precioStr}
                                    <span class="unit">/${item.unidad || 'ud'}</span>
                                </div>
                                <div class="qty-controls">
                                    <button class="qty-btn minus" onclick="changeQty(${idx}, -1)">&minus;</button>
                                    <input type="number" class="qty-input" id="qty-${idx}" value="${qty}" min="0"
                                        onchange="setQty(${idx}, this.value)"
                                        onfocus="this.select()">
                                    <button class="qty-btn plus" onclick="changeQty(${idx}, 1)">+</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    main.innerHTML = html;
}

function filterProducts(query) {
    const q = query.toLowerCase().trim();
    const sections = document.querySelectorAll('.category-section');

    if (!q) {
        document.querySelectorAll('.product-row').forEach(r => r.style.display = '');
        sections.forEach(s => s.style.display = '');
        return;
    }

    sections.forEach(section => {
        const sectionRows = section.querySelectorAll('.product-row');
        let anyVisible = false;
        sectionRows.forEach(row => {
            const name = row.querySelector('.product-name').textContent.toLowerCase();
            const code = row.querySelector('.product-code')?.textContent.toLowerCase() || '';
            const match = name.includes(q) || code.includes(q);
            row.style.display = match ? '' : 'none';
            if (match) anyVisible = true;
        });
        section.style.display = anyVisible ? '' : 'none';
    });
}

// --- CANTIDADES ---

function changeQty(idx, delta) {
    const input = document.getElementById(`qty-${idx}`);
    let val = parseInt(input.value) || 0;
    val = Math.max(0, val + delta);
    input.value = val;
    setQty(idx, val);
}

function setQty(idx, val) {
    val = Math.max(0, parseInt(val) || 0);
    const input = document.getElementById(`qty-${idx}`);
    if (input) input.value = val;

    if (val > 0) {
        inventario[idx] = val;
    } else {
        delete inventario[idx];
    }

    // Update row styling
    const row = document.getElementById(`row-${idx}`);
    if (row) {
        const stockMin = productos[idx].stockMinimo || 0;
        row.classList.toggle('has-qty', val > 0);
        row.classList.remove('stock-ok', 'stock-bajo', 'stock-critico');
        if (val > 0 && val >= stockMin) row.classList.add('stock-ok');
        else if (val > 0 && val < stockMin) row.classList.add('stock-bajo');
        else if (stockMin > 0 && val === 0) row.classList.add('stock-critico');
    }

    saveInventario();
    updateBadge();
    updateTabCounts();
}

function updateTabCounts() {
    const select = document.getElementById('select-proveedor');
    if (!select) return;
    const proveedores = getProveedores();
    const options = select.options;
    for (let i = 0; i < options.length; i++) {
        const prov = proveedores[i];
        const items = productos.filter(p => p.proveedor === prov);
        const count = items.length;
        const filled = items.filter(p => {
            const idx = productos.indexOf(p);
            return inventario[idx] > 0;
        }).length;
        const shortName = prov.replace(/\s*\(.*\)/, '');
        options[i].textContent = `${shortName} (${filled}/${count})`;
    }
}

// --- RESUMEN ---

function toggleResumen() {
    const panel = document.getElementById('panel-resumen');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        renderResumen();
    }
}

function renderResumen() {
    const content = document.getElementById('resumen-content');
    const indices = Object.keys(inventario).map(Number).filter(i => inventario[i] > 0);

    if (indices.length === 0) {
        content.innerHTML = '<p class="empty-msg">No se ha registrado inventario</p>';
        return;
    }

    const porProv = {};
    indices.forEach(i => {
        const p = productos[i];
        if (!porProv[p.proveedor]) porProv[p.proveedor] = [];
        porProv[p.proveedor].push(i);
    });

    let html = '';
    Object.keys(porProv).forEach(prov => {
        const provEscaped = prov.replace(/'/g, "\\'");
        let needOrder = 0;

        html += `<div class="resumen-proveedor">
            <div class="resumen-prov-header">
                <span class="resumen-prov-name">${prov}</span>
                <button class="btn-pdf-mini" onclick="descargarPDFProveedor('${provEscaped}')">PDF</button>
            </div>`;

        porProv[prov].forEach(i => {
            const p = productos[i];
            const qty = inventario[i];
            const stockMin = p.stockMinimo || 0;
            const bajo = stockMin > 0 && qty < stockMin;
            if (bajo) needOrder++;

            html += `<div class="resumen-item ${bajo ? 'resumen-item-bajo' : ''}">
                <span class="resumen-item-name">${p.producto}</span>
                <span class="resumen-item-qty">
                    Hay: <strong>${qty}</strong>
                    ${stockMin > 0 ? ` / Min: ${stockMin}` : ''}
                    ${bajo ? ' <span class="tag-pedir">PEDIR</span>' : ''}
                </span>
            </div>`;
        });

        html += `<div class="resumen-subtotal">
            ${porProv[prov].length} registrados
            ${needOrder > 0 ? ` · <span class="text-danger">${needOrder} por pedir</span>` : ' · Todo OK'}
        </div></div>`;
    });

    content.innerHTML = html;
}

function updateBadge() {
    const count = Object.keys(inventario).filter(k => inventario[k] > 0).length;
    const badge = document.getElementById('badge-count');
    badge.textContent = count;
    badge.setAttribute('data-count', count);
}

// --- GUARDAR EN GOOGLE SHEETS ---

async function guardarEnSheet() {
    const indices = Object.keys(inventario).map(Number).filter(i => inventario[i] > 0);

    if (indices.length === 0) {
        showToast('No hay inventario para guardar');
        return;
    }

    if (!usandoAPI) {
        showToast('Modo offline: datos guardados localmente');
        return;
    }

    if (!confirm(`¿Guardar inventario? (${indices.length} productos registrados por ${usuarioActual})`)) return;

    showLoading('Guardando en Google Sheets...');

    const items = indices.map(i => ({
        proveedor: productos[i].proveedor,
        codigo: productos[i].codigo,
        producto: productos[i].producto,
        unidad: productos[i].unidad,
        stockActual: inventario[i],
        stockMinimo: productos[i].stockMinimo || 0
    }));

    try {
        const resp = await fetch(CONFIG_CASA_AMPARO.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'guardarInventario',
                usuario: usuarioActual,
                items: items
            })
        });
        const data = await resp.json();

        if (data.error) throw new Error(data.error);

        hideLoading();
        showToast(`Guardado: ${data.mensaje} (${data.fecha} ${data.hora})`);
    } catch (err) {
        hideLoading();
        showToast('Error al guardar: ' + err.message);
        console.error(err);
    }
}

// --- MODO ADMIN ---

function toggleModo() {
    modoAdmin = !modoAdmin;
    const btn = document.getElementById('btn-modo');
    const vistaInv = document.getElementById('vista-inventario');
    const vistaAdmin = document.getElementById('vista-admin');

    if (modoAdmin) {
        btn.textContent = 'Modo Inventario';
        btn.classList.add('active');
        vistaInv.classList.add('hidden');
        vistaAdmin.classList.remove('hidden');
        cargarAdminPedidos();
    } else {
        btn.textContent = 'Modo Admin';
        btn.classList.remove('active');
        vistaInv.classList.remove('hidden');
        vistaAdmin.classList.add('hidden');
    }
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (tab === 'pedidos') cargarAdminPedidos();
    else if (tab === 'historico') cargarAdminHistorico();
}

async function cargarAdminPedidos() {
    const content = document.getElementById('admin-content');

    if (!usandoAPI) {
        // Offline: calculate from local data
        const pedidos = calcularPedidosLocales();
        renderAdminPedidos(pedidos);
        return;
    }

    content.innerHTML = '<p class="loading-text">Cargando pedidos sugeridos...</p>';

    try {
        const resp = await fetch(CONFIG_CASA_AMPARO.API_URL + '?action=getPedidosPendientes');
        const data = await resp.json();
        renderAdminPedidos(data.pedidos || []);
    } catch (err) {
        content.innerHTML = '<p class="error-text">Error: ' + err.message + '</p>';
    }
}

function calcularPedidosLocales() {
    const pedidos = [];
    productos.forEach((p, idx) => {
        const stockMin = p.stockMinimo || 0;
        const stockActual = inventario[idx] || 0;
        if (stockMin > 0 && stockActual < stockMin) {
            pedidos.push({
                proveedor: p.proveedor,
                codigo: p.codigo,
                producto: p.producto,
                unidad: p.unidad,
                stockActual: stockActual,
                stockMinimo: stockMin,
                cantidadPedir: stockMin - stockActual
            });
        }
    });
    return pedidos;
}

function renderAdminPedidos(pedidos) {
    const content = document.getElementById('admin-content');

    if (pedidos.length === 0) {
        content.innerHTML = '<div class="admin-empty"><p>No hay pedidos pendientes. Todo el stock está por encima del mínimo.</p></div>';
        return;
    }

    // Group by provider
    const porProv = {};
    pedidos.forEach(p => {
        if (!porProv[p.proveedor]) porProv[p.proveedor] = [];
        porProv[p.proveedor].push(p);
    });

    let html = `<div class="admin-summary">
        <span>${pedidos.length} productos por pedir de ${Object.keys(porProv).length} proveedores</span>
        <button class="btn-descargar-todos" onclick="descargarTodosPDFPedidos()">Descargar Todos PDF</button>
    </div>`;

    Object.keys(porProv).forEach(prov => {
        const items = porProv[prov];
        const provEscaped = prov.replace(/'/g, "\\'");

        html += `
        <div class="admin-proveedor">
            <div class="admin-prov-header">
                <span>${prov}</span>
                <span class="admin-prov-count">${items.length} productos</span>
                <button class="btn-pdf-mini" onclick="descargarPDFPedidoProveedor('${provEscaped}')">PDF Pedido</button>
            </div>
            <table class="admin-table">
                <thead>
                    <tr><th>Código</th><th>Producto</th><th>Hay</th><th>Mín</th><th>Pedir</th></tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td class="code">${item.codigo || '-'}</td>
                            <td>${item.producto}</td>
                            <td class="num stock-bajo-cell">${item.stockActual}</td>
                            <td class="num">${item.stockMinimo}</td>
                            <td class="num pedir-cell"><strong>${item.cantidadPedir}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    });

    content.innerHTML = html;
}

async function cargarAdminHistorico() {
    const content = document.getElementById('admin-content');

    if (!usandoAPI) {
        content.innerHTML = '<div class="admin-empty"><p>El histórico requiere conexión con Google Sheets.<br>En modo offline solo se guardan datos localmente.</p></div>';
        return;
    }

    content.innerHTML = '<p class="loading-text">Cargando histórico...</p>';

    try {
        const resp = await fetch(CONFIG_CASA_AMPARO.API_URL + '?action=getHistorico&dias=7');
        const data = await resp.json();
        renderAdminHistorico(data.registros || []);
    } catch (err) {
        content.innerHTML = '<p class="error-text">Error: ' + err.message + '</p>';
    }
}

function renderAdminHistorico(registros) {
    const content = document.getElementById('admin-content');

    if (registros.length === 0) {
        content.innerHTML = '<div class="admin-empty"><p>No hay registros en los últimos 7 días.</p></div>';
        return;
    }

    // Group by date
    const porFecha = {};
    registros.forEach(r => {
        const key = `${r.fecha} ${r.hora} - ${r.usuario}`;
        if (!porFecha[key]) porFecha[key] = [];
        porFecha[key].push(r);
    });

    let html = '';
    Object.keys(porFecha).forEach(key => {
        const items = porFecha[key];
        const necesitan = items.filter(i => i.necesitaPedir === 'SÍ').length;

        html += `
        <div class="admin-proveedor">
            <div class="admin-prov-header">
                <span>${key}</span>
                <span class="admin-prov-count">${items.length} productos · ${necesitan} por pedir</span>
            </div>
            <table class="admin-table">
                <thead>
                    <tr><th>Proveedor</th><th>Producto</th><th>Stock</th><th>Mín</th><th>Estado</th></tr>
                </thead>
                <tbody>
                    ${items.slice(0, 50).map(item => `
                        <tr class="${item.necesitaPedir === 'SÍ' ? 'row-pedir' : ''}">
                            <td class="code">${item.proveedor}</td>
                            <td>${item.producto}</td>
                            <td class="num">${item.stockActual}</td>
                            <td class="num">${item.stockMinimo}</td>
                            <td class="num">${item.necesitaPedir === 'SÍ' ? '<span class="tag-pedir">PEDIR</span>' : 'OK'}</td>
                        </tr>
                    `).join('')}
                    ${items.length > 50 ? `<tr><td colspan="5" class="text-center">... y ${items.length - 50} más</td></tr>` : ''}
                </tbody>
            </table>
        </div>`;
    });

    content.innerHTML = html;
}

// --- PDF GENERATION ---

function generarPDFInventarioProveedor(proveedor) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const items = [];
    productos.forEach((p, idx) => {
        if (p.proveedor === proveedor) {
            items.push({ ...p, stock: inventario[idx] || 0, idx: idx });
        }
    });

    const fecha = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    // Header
    doc.setFillColor(44, 24, 16);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Casa Amparo 1948', 14, 15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Control de Inventario', 14, 23);
    doc.setFontSize(9);
    doc.text(`${fecha}  |  ${usuarioActual}`, 196, 15, { align: 'right' });

    doc.setTextColor(139, 69, 19);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Proveedor: ${proveedor}`, 14, 45);
    doc.setDrawColor(139, 69, 19);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);

    const categorias = [];
    items.forEach(item => {
        if (!categorias.includes(item.categoria)) categorias.push(item.categoria);
    });

    const tableData = [];
    categorias.forEach(cat => {
        const catItems = items.filter(i => i.categoria === cat);
        tableData.push([{
            content: cat, colSpan: 6,
            styles: { fillColor: [139, 69, 19], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, cellPadding: 4 }
        }]);
        catItems.forEach(item => {
            const precioStr = typeof item.precio === 'number' ? item.precio.toFixed(2).replace('.', ',') + ' \u20AC' : 'S/P';
            const stockMin = item.stockMinimo || 0;
            const necesita = stockMin > 0 && item.stock < stockMin;
            const pedir = necesita ? stockMin - item.stock : 0;

            tableData.push([
                item.codigo || '',
                item.producto,
                precioStr,
                item.unidad || 'ud',
                { content: item.stock.toString(), styles: {
                    fontStyle: 'bold', fontSize: 11, halign: 'center',
                    fillColor: item.stock >= stockMin ? [232, 245, 233] : [255, 243, 224]
                }},
                { content: pedir > 0 ? pedir.toString() : '-', styles: {
                    fontStyle: 'bold', fontSize: 11, halign: 'center',
                    textColor: pedir > 0 ? [198, 40, 40] : [150, 150, 150],
                    fillColor: pedir > 0 ? [255, 235, 238] : [255, 255, 255]
                }}
            ]);
        });
    });

    doc.autoTable({
        startY: 52,
        head: [['Código', 'Producto', 'Precio', 'Unidad', 'Hay', 'Pedir']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [44, 24, 16], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold', cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 24, fontSize: 8 },
            1: { cellWidth: 'auto', fontSize: 8.5 },
            2: { cellWidth: 22, halign: 'right', fontSize: 8 },
            3: { cellWidth: 18, halign: 'center', fontSize: 8 },
            4: { cellWidth: 16, halign: 'center', fontSize: 10 },
            5: { cellWidth: 16, halign: 'center', fontSize: 10 }
        },
        styles: { cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.25 },
        alternateRowStyles: { fillColor: [250, 247, 243] },
        margin: { left: 14, right: 14 },
        didDrawPage: function(data) {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Casa Amparo 1948 - Inventario ${proveedor} - Pag. ${data.pageNumber}`, 105, 290, { align: 'center' });
        }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    const conStock = items.filter(i => i.stock > 0).length;
    const porPedir = items.filter(i => (i.stockMinimo || 0) > 0 && i.stock < i.stockMinimo).length;

    if (finalY < 270) {
        doc.setDrawColor(139, 69, 19);
        doc.setLineWidth(0.5);
        doc.line(14, finalY, 196, finalY);
        doc.setTextColor(44, 24, 16);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${items.length} productos | Con stock: ${conStock} | Por pedir: ${porPedir}`, 14, finalY + 7);
    }

    return doc;
}

function generarPDFPedidoProveedor(proveedor) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pedidos = [];
    productos.forEach((p, idx) => {
        if (p.proveedor === proveedor) {
            const stockMin = p.stockMinimo || 0;
            const stockActual = inventario[idx] || 0;
            if (stockMin > 0 && stockActual < stockMin) {
                pedidos.push({ ...p, stockActual, cantidadPedir: stockMin - stockActual });
            }
        }
    });

    if (pedidos.length === 0) {
        showToast(`${proveedor}: no hay productos por pedir`);
        return null;
    }

    const fecha = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    // Header
    doc.setFillColor(44, 24, 16);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Casa Amparo 1948', 14, 15);
    doc.setFontSize(13);
    doc.text('PEDIDO', 14, 25);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(fecha, 196, 15, { align: 'right' });

    doc.setTextColor(139, 69, 19);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Para: ${proveedor}`, 14, 45);
    doc.setDrawColor(139, 69, 19);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);

    const tableData = pedidos.map(p => [
        p.codigo || '',
        p.producto,
        p.unidad || 'ud',
        { content: p.cantidadPedir.toString(), styles: { fontStyle: 'bold', fontSize: 12, halign: 'center' } }
    ]);

    doc.autoTable({
        startY: 52,
        head: [['Código', 'Producto', 'Unidad', 'Cantidad']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [44, 24, 16], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 28, fontSize: 9 },
            1: { cellWidth: 'auto', fontSize: 9.5 },
            2: { cellWidth: 24, halign: 'center', fontSize: 9 },
            3: { cellWidth: 28, halign: 'center', fontSize: 12 }
        },
        styles: { cellPadding: 4, lineColor: [200, 200, 200], lineWidth: 0.25 },
        alternateRowStyles: { fillColor: [250, 247, 243] },
        margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    if (finalY < 260) {
        doc.setTextColor(44, 24, 16);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${pedidos.length} productos`, 14, finalY);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150);
        doc.text('Generado desde Casa Amparo 1948 - Control de Inventario', 14, finalY + 8);
    }

    return doc;
}

function descargarPDFProveedor(proveedor) {
    const doc = generarPDFInventarioProveedor(proveedor);
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreLimpio = proveedor.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Inventario_${nombreLimpio}_${fecha}.pdf`);
    showToast(`PDF inventario ${proveedor} descargado`);
}

function descargarPDFPedidoProveedor(proveedor) {
    const doc = generarPDFPedidoProveedor(proveedor);
    if (!doc) return;
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreLimpio = proveedor.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Pedido_${nombreLimpio}_${fecha}.pdf`);
    showToast(`PDF pedido ${proveedor} descargado`);
}

function descargarTodosPDFPedidos() {
    const proveedores = getProveedores();
    let count = 0;

    proveedores.forEach((prov, i) => {
        const tiene = productos.some((p, idx) => {
            const stockMin = p.stockMinimo || 0;
            const stockActual = inventario[idx] || 0;
            return p.proveedor === prov && stockMin > 0 && stockActual < stockMin;
        });

        if (tiene) {
            setTimeout(() => {
                descargarPDFPedidoProveedor(prov);
            }, count * 500);
            count++;
        }
    });

    if (count === 0) {
        showToast('No hay pedidos pendientes');
    } else {
        showToast(`Descargando ${count} PDFs de pedido...`);
    }
}

// --- ACCIONES ---

function limpiarInventario() {
    if (!confirm('¿Limpiar todo el inventario registrado?')) return;
    inventario = {};
    saveInventario();
    updateBadge();
    updateTabCounts();
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) renderPanel(parseInt(activeTab.dataset.tab));
    renderResumen();
    showToast('Inventario limpiado');
}

// --- PERSISTENCIA LOCAL ---

function saveInventario() {
    localStorage.setItem('inventario_casa_amparo', JSON.stringify(inventario));
}

function loadInventario() {
    try {
        const saved = localStorage.getItem('inventario_casa_amparo');
        if (saved) inventario = JSON.parse(saved);
    } catch (e) {
        inventario = {};
    }
}

// --- LOADING ---

function showLoading(msg) {
    document.getElementById('loading-msg').textContent = msg || 'Cargando...';
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// --- TOAST ---

function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- INIT ---
init();
