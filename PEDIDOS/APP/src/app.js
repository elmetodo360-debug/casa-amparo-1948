// ============================================================
// CASA AMPARO 1948 - App de Inventario
// ============================================================

let productos = [];
let inventario = {}; // { index: cantidad que HAY }
let pedidos = {};    // { index: cantidad a PEDIR }
let usuarioActual = '';
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
        productos = await resp.json();
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
                        return inventario[idx] > 0 || pedidos[idx] > 0;
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
            <button class="btn-copiar-proveedor" onclick="copiarPedidoProveedor('${provEscaped}')">
                Copiar Pedido
            </button>
        </div>
    `;

    categorias.forEach(cat => {
        const catItems = items.filter(i => i.categoria === cat);
        html += `
            <div class="category-section" data-cat="${cat}">
                <div class="category-header">${cat}</div>
                <div class="product-table">
                    <div class="product-table-head">
                        <span class="col-producto">Producto</span>
                        <span class="col-real">Stock Real</span>
                        <span class="col-real">Pedido</span>
                    </div>
                    ${catItems.map(item => {
                        const idx = productos.indexOf(item);
                        const qty = inventario[idx] || 0;
                        const ped = pedidos[idx] || 0;

                        return `
                            <div class="product-row ${qty > 0 ? 'stock-ok' : ''}" id="row-${idx}">
                                <div class="col-producto">
                                    <div class="product-name">${item.producto}</div>
                                    <div class="product-meta">
                                        ${item.codigo ? `<span class="product-code">${item.codigo}</span> ` : ''}
                                        ${item.unidad || ''}
                                    </div>
                                </div>
                                <div class="col-real">
                                    <button class="qty-btn minus" onclick="changeQty(${idx}, -1)">&minus;</button>
                                    <input type="number" class="qty-input" id="qty-${idx}" value="${qty}" min="0"
                                        onchange="setQty(${idx}, this.value)"
                                        onfocus="this.select()">
                                    <button class="qty-btn plus" onclick="changeQty(${idx}, 1)">+</button>
                                </div>
                                <div class="col-real">
                                    <button class="qty-btn minus" onclick="changePedido(${idx}, -1)">&minus;</button>
                                    <input type="number" class="qty-input pedido-input" id="ped-${idx}" value="${ped}" min="0"
                                        onchange="setPedido(${idx}, this.value)"
                                        onfocus="this.select()">
                                    <button class="qty-btn plus" onclick="changePedido(${idx}, 1)">+</button>
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

    const row = document.getElementById(`row-${idx}`);
    if (row) {
        row.classList.toggle('stock-ok', val > 0);
    }

    saveInventario();
    updateBadge();
    updateTabCounts();
}

function changePedido(idx, delta) {
    const input = document.getElementById(`ped-${idx}`);
    let val = parseInt(input.value) || 0;
    val = Math.max(0, val + delta);
    input.value = val;
    setPedido(idx, val);
}

function setPedido(idx, val) {
    val = Math.max(0, parseInt(val) || 0);
    const input = document.getElementById(`ped-${idx}`);
    if (input) input.value = val;

    if (val > 0) {
        pedidos[idx] = val;
    } else {
        delete pedidos[idx];
    }

    const row = document.getElementById(`row-${idx}`);
    if (row) {
        row.classList.toggle('pedido-row', val > 0);
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
            return inventario[idx] > 0 || pedidos[idx] > 0;
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

    // Collect all indices that have stock or pedido
    const allIndices = new Set([
        ...Object.keys(inventario).map(Number).filter(i => inventario[i] > 0),
        ...Object.keys(pedidos).map(Number).filter(i => pedidos[i] > 0)
    ]);

    if (allIndices.size === 0) {
        content.innerHTML = '<p class="empty-msg">No se ha registrado inventario</p>';
        return;
    }

    const porProv = {};
    allIndices.forEach(i => {
        const p = productos[i];
        if (!porProv[p.proveedor]) porProv[p.proveedor] = [];
        porProv[p.proveedor].push(i);
    });

    let html = '';
    Object.keys(porProv).forEach(prov => {
        const provEscaped = prov.replace(/'/g, "\\'");
        let totalPedir = 0;

        html += `<div class="resumen-proveedor">
            <div class="resumen-prov-header">
                <span class="resumen-prov-name">${prov}</span>
                <button class="btn-copiar-mini" onclick="copiarPedidoProveedor('${provEscaped}')">Copiar</button>
            </div>`;

        porProv[prov].forEach(i => {
            const p = productos[i];
            const qty = inventario[i] || 0;
            const ped = pedidos[i] || 0;
            if (ped > 0) totalPedir++;

            html += `<div class="resumen-item ${ped > 0 ? 'resumen-item-bajo' : ''}">
                <span class="resumen-item-name">${p.producto}</span>
                <span class="resumen-item-qty">
                    Hay: <strong>${qty}</strong>
                    ${ped > 0 ? ` · Pedir: <strong>${ped}</strong> <span class="tag-pedir">PEDIR</span>` : ''}
                </span>
            </div>`;
        });

        html += `<div class="resumen-subtotal">
            ${porProv[prov].length} registrados
            ${totalPedir > 0 ? ` · <span class="text-danger">${totalPedir} por pedir</span>` : ''}
        </div></div>`;
    });

    content.innerHTML = html;
}

function updateBadge() {
    const allIndices = new Set([
        ...Object.keys(inventario).filter(k => inventario[k] > 0),
        ...Object.keys(pedidos).filter(k => pedidos[k] > 0)
    ]);
    const count = allIndices.size;
    const badge = document.getElementById('badge-count');
    badge.textContent = count;
    badge.setAttribute('data-count', count);
}

// --- GUARDAR EN GOOGLE SHEETS ---

async function guardarEnSheet() {
    const allIndices = new Set([
        ...Object.keys(inventario).map(Number).filter(i => inventario[i] > 0),
        ...Object.keys(pedidos).map(Number).filter(i => pedidos[i] > 0)
    ]);

    if (allIndices.size === 0) {
        showToast('No hay inventario para guardar');
        return;
    }

    if (!usandoAPI) {
        showToast('Modo offline: datos guardados localmente');
        return;
    }

    if (!confirm(`¿Guardar inventario? (${allIndices.size} productos registrados por ${usuarioActual})`)) return;

    showLoading('Guardando en Google Sheets...');

    const items = [...allIndices].map(i => ({
        proveedor: productos[i].proveedor,
        codigo: productos[i].codigo,
        producto: productos[i].producto,
        unidad: productos[i].unidad,
        stockActual: inventario[i] || 0,
        pedidoPropuesto: pedidos[i] || 0
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

// --- COPIAR PEDIDO PARA WHATSAPP ---

function generarTextoProveedor(proveedor) {
    const itemsPedir = [];
    productos.forEach((p, idx) => {
        if (p.proveedor === proveedor && (pedidos[idx] || 0) > 0) {
            itemsPedir.push({ ...p, stock: inventario[idx] || 0, cantidad: pedidos[idx] });
        }
    });

    if (itemsPedir.length === 0) return null;

    const fecha = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    let texto = `*PEDIDO - Casa Amparo 1948*\n`;
    texto += `${fecha}\n\n`;
    texto += `*${proveedor}*\n`;
    texto += `———————————————\n`;

    itemsPedir.forEach(item => {
        const unidad = item.unidad ? ` (${item.unidad})` : '';
        texto += `${item.producto}${unidad}\n`;
        texto += `  Hay: ${item.stock} → Pedir: *${item.cantidad}*\n`;
    });

    texto += `———————————————\n`;
    texto += `*Total: ${itemsPedir.length} productos*`;

    return texto;
}

async function copiarPedidoProveedor(proveedor) {
    const texto = generarTextoProveedor(proveedor);
    if (!texto) {
        showToast(`${proveedor}: no hay productos por pedir`);
        return;
    }

    try {
        await navigator.clipboard.writeText(texto);
        showToast(`Pedido ${proveedor} copiado`);
    } catch (e) {
        fallbackCopiar(texto);
    }
}

async function copiarTodosPedidos() {
    const proveedores = getProveedores();
    const bloques = [];

    proveedores.forEach(prov => {
        const texto = generarTextoProveedor(prov);
        if (texto) bloques.push(texto);
    });

    if (bloques.length === 0) {
        showToast('No hay pedidos para copiar');
        return;
    }

    const textoCompleto = bloques.join('\n\n\n');

    try {
        await navigator.clipboard.writeText(textoCompleto);
        showToast(`${bloques.length} pedidos copiados`);
    } catch (e) {
        fallbackCopiar(textoCompleto);
    }
}

function fallbackCopiar(texto) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Pedido copiado');
}

// --- ACCIONES ---

function limpiarInventario() {
    if (!confirm('¿Limpiar todo el inventario registrado?')) return;
    inventario = {};
    pedidos = {};
    saveInventario();
    updateBadge();
    updateTabCounts();
    const select = document.getElementById('select-proveedor');
    if (select) renderPanel(parseInt(select.value) || 0);
    renderResumen();
    showToast('Inventario limpiado');
}

// --- PERSISTENCIA LOCAL ---

function saveInventario() {
    localStorage.setItem('inventario_casa_amparo', JSON.stringify(inventario));
    localStorage.setItem('pedidos_casa_amparo', JSON.stringify(pedidos));
}

function loadInventario() {
    try {
        const saved = localStorage.getItem('inventario_casa_amparo');
        if (saved) inventario = JSON.parse(saved);
    } catch (e) {
        inventario = {};
    }
    try {
        const saved = localStorage.getItem('pedidos_casa_amparo');
        if (saved) pedidos = JSON.parse(saved);
    } catch (e) {
        pedidos = {};
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
