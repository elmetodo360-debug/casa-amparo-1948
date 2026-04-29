/* Comida de Familia · Casa Amparo 1948
   SPA vanilla JS · lee data/menu.json y pinta calendario, recetario, normas y compra. */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const DIA_ORDER = { Lunes: 1, Martes: 2, "Miércoles": 3, Jueves: 4, Viernes: 5, "Sábado": 6 };

let DATA = null;

// =========================================================================
// BOOT
// =========================================================================
async function boot() {
  try {
    const res = await fetch("data/menu.json?v=" + Date.now());
    DATA = await res.json();
  } catch (e) {
    console.error(e);
    document.body.innerHTML = "<p style='padding:40px;text-align:center'>No se pudo cargar el menú.</p>";
    return;
  }

  $("#footer-fecha").textContent = "Actualizado " + (DATA.actualizado || "");
  if (DATA.personas) $("#personas-info").textContent = `${DATA.personas} personas`;

  pintarCalendario();
  pintarRecetas();
  pintarNormas();
  pintarCompra();

  initTabs();
  initSearch();
  initDetail();
}

// =========================================================================
// TABS
// =========================================================================
function initTabs() {
  $$(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".tab").forEach((b) => b.classList.remove("active"));
      $$(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $(`#tab-${btn.dataset.tab}`).classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

// =========================================================================
// CALENDARIO
// =========================================================================
function pintarCalendario() {
  const grid = $("#weeks-grid");
  grid.innerHTML = "";
  const porSemana = {};
  DATA.calendario.forEach((d) => {
    if (!porSemana[d.semana]) porSemana[d.semana] = [];
    porSemana[d.semana].push(d);
  });
  Object.keys(porSemana).sort((a, b) => a - b).forEach((sem) => {
    const week = document.createElement("div");
    week.className = "week";
    week.innerHTML = `<div class="week-header">Semana ${sem}</div>`;
    const wgrid = document.createElement("div");
    wgrid.className = "week-grid";
    porSemana[sem]
      .sort((a, b) => DIA_ORDER[a.dia] - DIA_ORDER[b.dia])
      .forEach((d) => {
        const card = document.createElement("div");
        card.className = "day-card" + (d.esPescado ? " pescado" : "");
        card.innerHTML = `
          <div class="day-name">${d.dia}${d.esPescado ? " 🐟" : ""}</div>
          <div class="day-plato">${escapeHtml(d.plato)}</div>
          <div class="day-guarn">${escapeHtml(d.guarnicion || "—")}</div>`;
        card.addEventListener("click", () => abrirDetalle(d.semana, d.dia));
        wgrid.appendChild(card);
      });
    week.appendChild(wgrid);
    grid.appendChild(week);
  });
}

// =========================================================================
// RECETARIO
// =========================================================================
function pintarRecetas(filtro = "") {
  const grid = $("#recetas-grid");
  grid.innerHTML = "";
  const f = (filtro || "").toLowerCase().trim();

  const recetas = DATA.recetas.filter((r) => {
    if (!f) return true;
    if (r.plato.toLowerCase().includes(f)) return true;
    if (r.dia.toLowerCase().includes(f)) return true;
    if ((r.guarnicion || "").toLowerCase().includes(f)) return true;
    return r.ingredientes.some((i) => (i.nombre || "").toLowerCase().includes(f));
  });

  $("#empty").classList.toggle("hidden", recetas.length > 0);

  recetas.forEach((r) => {
    const card = document.createElement("article");
    card.className = "receta-card" + (r.esPescado ? " pescado" : "");
    card.innerHTML = `
      <div class="receta-card-body">
        <div class="receta-card-meta">Sem ${r.semana} · ${r.dia}${r.esPescado ? " · 🐟" : ""}</div>
        <div class="receta-card-title">${escapeHtml(r.plato)}</div>
        <div class="receta-card-guarn">🍽️ ${escapeHtml(r.guarnicion || "—")}</div>
      </div>`;
    card.addEventListener("click", () => abrirDetalle(r.semana, r.dia));
    grid.appendChild(card);
  });
}

function initSearch() {
  const inp = $("#search");
  inp.addEventListener("input", () => pintarRecetas(inp.value));
}

// =========================================================================
// NORMAS
// =========================================================================
function pintarNormas() {
  const list = $("#normas-list");
  list.innerHTML = "";
  DATA.normas.forEach((n) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="norma-titulo">${escapeHtml(n.titulo)}</div>
      <div class="norma-detalle">${escapeHtml(n.detalle)}</div>`;
    list.appendChild(li);
  });
}

// =========================================================================
// COMPRA
// =========================================================================
function pintarCompra() {
  const grid = $("#compra-grid");
  grid.innerHTML = "";
  const porProveedor = {};
  DATA.compraTotal.forEach((p) => {
    if (!porProveedor[p.proveedor]) porProveedor[p.proveedor] = [];
    porProveedor[p.proveedor].push(p);
  });
  Object.keys(porProveedor).sort().forEach((prov) => {
    const card = document.createElement("div");
    card.className = "proveedor-card";
    const items = porProveedor[prov]
      .sort((a, b) => a.producto.localeCompare(b.producto))
      .map((p) => {
        const cant = formatCantidad(p.cantidad, p.udm);
        return `<tr>
          <td><span class="codigo">${escapeHtml(p.codigo)}</span></td>
          <td>${escapeHtml(p.producto)}</td>
          <td class="cantidad">${cant}</td>
        </tr>`;
      }).join("");
    card.innerHTML = `
      <div class="proveedor-header">${escapeHtml(prov)} · ${porProveedor[prov].length} productos</div>
      <table class="proveedor-table">
        <thead><tr><th>Código</th><th>Producto</th><th style="text-align:right">Cantidad mes</th></tr></thead>
        <tbody>${items}</tbody>
      </table>`;
    grid.appendChild(card);
  });
}

// =========================================================================
// DETALLE
// =========================================================================
function initDetail() {
  $("#back").addEventListener("click", cerrarDetalle);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") cerrarDetalle();
  });
}

function abrirDetalle(semana, dia) {
  const r = DATA.recetas.find((x) => x.semana === semana && x.dia === dia);
  if (!r) return;
  const c = $("#detail-content");

  const pasosHtml = (r.pasos || []).length
    ? `<ol class="detail-pasos">${r.pasos.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ol>`
    : `<p style="color:#888;font-style:italic">Sin pasos registrados.</p>`;

  const ingHtml = r.ingredientes.map((i) => {
    const tipoCls = (i.tipo || "").toLowerCase().replace("ó", "o");
    const cant = formatCantidad(i.cantidad, i.udm);
    return `<tr>
      <td><span class="ing-tipo ${tipoCls}">${escapeHtml(i.tipo || "")}</span></td>
      <td>${escapeHtml(i.nombre)}</td>
      <td>${escapeHtml(i.proveedor || "")} <span class="codigo">${escapeHtml(i.codigo || "")}</span></td>
      <td class="qty">${cant}</td>
    </tr>`;
  }).join("");

  c.innerHTML = `
    <div class="detail-meta">Semana ${r.semana} · ${r.dia}${r.esPescado ? " · 🐟 Pescado" : ""}</div>
    <h2 class="detail-title">${escapeHtml(r.plato)}</h2>
    <div style="font-size:14px;color:#666">Guarnición: <strong>${escapeHtml(r.guarnicion || "—")}</strong></div>

    <div class="detail-section">
      <h3>Pasos de elaboración</h3>
      ${pasosHtml}
    </div>

    <div class="detail-section">
      <h3>Ingredientes (${DATA.personas} personas)</h3>
      <table class="ing-table">
        <thead><tr><th>Tipo</th><th>Producto</th><th>Proveedor / Cód.</th><th style="text-align:right">Cant.</th></tr></thead>
        <tbody>${ingHtml}</tbody>
      </table>
    </div>`;

  $("#detail").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarDetalle() {
  $("#detail").classList.add("hidden");
  document.body.style.overflow = "";
}

// =========================================================================
// HELPERS
// =========================================================================
function formatCantidad(cant, udm) {
  if (cant == null || cant === "") return "—";
  const n = Number(cant);
  if (Number.isNaN(n)) return cant + (udm ? " " + udm : "");
  if (udm === "GR" && n >= 1000) return (n / 1000).toFixed(2) + " kg";
  if (udm === "ML" && n >= 1000) return (n / 1000).toFixed(2) + " L";
  if (udm === "UND") return n + " ud";
  return n + " " + (udm || "").toLowerCase();
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// arrancar
boot();
