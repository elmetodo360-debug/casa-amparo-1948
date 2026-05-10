/* app.js — bootstrap Sprint 2: routing por hash + carga datos + init módulos */

const App = {
  EXPECTED_TABS: [
    "Canapes_Coctel",
    "Menus_Sentados",
    "Coffee_Breaks",
    "Estaciones_Showcooking",
    "Ratios_Personal",
    "Tarifas_Personal",
    "Bebida",
    "Globales",
  ],
  data: null,

  async init() {
    Utils.log("Iniciando App Eventos v0.2 (Sprint 2)");
    this.bindRouter();

    this.setStatus("Cargando…");
    try {
      this.data = await DataLoader.loadAll();
      this.setStatus("OK", "ok");
      Wizard.init(this.data);
      Eventos.init();
      CalcPersonal.init(this.data);
      CalcBebida.init(this.data);
      CalcComida.init(this.data);
      CalcEscandallo.init(this.data);
      GenOrdenServicio.init(this.data);
      GenOrdenCompra.init(this.data);
      // Renderiza vista de datos también (cards + previews) sin esperar al usuario
      this.renderDataView();
    } catch (e) {
      Utils.err("Init fallo:", e);
      this.setStatus("Error", "error");
      this.showError(e);
    }
    // Pinta vista inicial (por defecto wizard si no hay hash)
    this.applyRoute();
  },

  /* --- ROUTER --- */
  bindRouter() {
    window.addEventListener("hashchange", () => this.applyRoute());
  },

  applyRoute() {
    const raw = (window.location.hash || "#wizard").replace(/^#/, "");
    const [view, ...params] = raw.split("/");
    const valid = ["wizard", "eventos", "datos", "calculo"];
    const v = valid.includes(view) ? view : "wizard";

    // Toggle visible
    document.querySelectorAll(".view").forEach(el => el.classList.add("hidden"));
    const target = document.getElementById("view-" + v);
    if (target) target.classList.remove("hidden");

    // Highlight nav (sin parámetros)
    document.querySelectorAll(".nav-link").forEach(a => {
      const isActive = a.getAttribute("href") === "#" + v;
      a.classList.toggle("bg-white/20", isActive);
    });

    // Acciones por vista
    if (v === "eventos" && window.Eventos) Eventos.refresh();
    if (v === "calculo" && window.Calculo) Calculo.render(params[0] || "", params[1] || "");
  },

  /* --- STATUS --- */
  setStatus(text, type = "loading") {
    const badge = document.getElementById("status-badge");
    if (!badge) return;
    badge.textContent = text;
    badge.className = "px-2 py-1 rounded " + (
      type === "ok" ? "bg-green-500" :
      type === "error" ? "bg-red-500" :
      "bg-white/10"
    );
  },

  showError(e) {
    const box = document.getElementById("error-box");
    if (!box) return;
    box.classList.remove("hidden");
    document.getElementById("error-message").textContent = e.message || String(e);
  },

  /* --- VISTA DATOS (movida desde Sprint 1) --- */
  renderDataView() {
    const container = document.getElementById("data-status");
    if (!container) return;
    container.innerHTML = "";
    this.EXPECTED_TABS.forEach(tab => {
      const result = this.data[tab];
      const card = Utils.el("div", "status-card");
      let body;
      if (!result) {
        card.classList.add("error");
        body = `<div>${Utils.esc(tab)}</div><div class="count">—</div><div class="text-stone-500">no encontrada</div>`;
      } else if (result.error) {
        card.classList.add("error");
        body = `<div>${Utils.esc(tab)}</div><div class="count">⚠</div><div class="text-stone-600 truncate" title="${Utils.esc(result.error)}">${Utils.esc(result.error.slice(0, 40))}…</div>`;
      } else {
        card.classList.add("ok");
        body = `<div>${Utils.esc(tab)}</div><div class="count">${result.count}</div><div class="text-stone-500">filas</div>`;
      }
      card.innerHTML = body;
      container.appendChild(card);
    });

    // Previews
    const prev = document.getElementById("previews");
    prev.innerHTML = "";
    this.EXPECTED_TABS.forEach(tab => {
      const result = this.data[tab];
      if (!result || result.error || !result.rows || result.rows.length === 0) return;
      const wrap = Utils.el("div", "border border-stone-200 rounded p-3 bg-stone-50");
      const headers = Object.keys(result.rows[0]);
      const sample = result.rows.slice(0, 5);
      let html = `<div class="font-semibold text-sm mb-2">${Utils.esc(tab)} <span class="text-stone-400 font-normal">(${result.count} filas)</span></div>`;
      html += '<div class="overflow-x-auto"><table class="preview-table"><thead><tr>';
      headers.forEach(h => html += `<th>${Utils.esc(h)}</th>`);
      html += "</tr></thead><tbody>";
      sample.forEach(row => {
        html += "<tr>";
        headers.forEach(h => {
          const v = row[h];
          html += `<td>${Utils.esc(v === null || v === "" ? "—" : v)}</td>`;
        });
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      wrap.innerHTML = html;
      prev.appendChild(wrap);
    });

    document.getElementById("loading")?.classList.add("hidden");
    document.getElementById("data-preview")?.classList.remove("hidden");
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
