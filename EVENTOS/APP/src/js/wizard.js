/* wizard.js — Sprint 2: configuración de evento (cóctel) */

const Wizard = {
  data: null,        // referencia a App.data
  currentEvent: null,

  init(appData) {
    this.data = appData;
    this.renderSignatures();
    this.renderEstaciones();
    this.bindForm();
    this.bindPackChange();
    this.bindTipoEventoChange();
    this.toggleBlocksByTipo("coctel");
  },

  bindTipoEventoChange() {
    const sel = document.getElementById("tipo_evento");
    sel.addEventListener("change", () => {
      this.toggleBlocksByTipo(sel.value);
      this.adjustDuracionDefault(sel.value);
    });
  },

  toggleBlocksByTipo(tipo) {
    document.querySelectorAll(".block-tipo").forEach(b => b.classList.add("hidden"));
    const target = document.getElementById("block-" + tipo);
    if (target) target.classList.remove("hidden");
  },

  adjustDuracionDefault(tipo) {
    const dur = document.querySelector('input[name="duracion_min"]');
    const defaults = {
      coctel: 75,
      menu_sentado: 120,
      coffee_break: 30,
      brasas: 120,
      arroces: 120,
    };
    if (defaults[tipo]) dur.value = defaults[tipo];
  },

  /** Pinta checkboxes de las piezas Signature (8 piezas tipo signature de Canapes_Coctel) */
  renderSignatures() {
    const list = document.getElementById("signatures-list");
    if (!list) return;
    const canapes = this.data.Canapes_Coctel?.rows || [];
    const signatures = canapes.filter(c => c.categoria === "signature");
    list.innerHTML = "";
    signatures.forEach(c => {
      const id = `sig-${c.n}`;
      const wrap = Utils.el("label", "flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-stone-50");
      wrap.innerHTML = `
        <input type="checkbox" name="signature" value="${c.n}" id="${id}" class="mt-0.5">
        <span>
          <span class="block">${Utils.esc(c.nombre)}</span>
          <span class="block text-xs text-stone-500">${Utils.esc(c.tipo)} · ${Utils.fmtEur(c.coste_ud)}/ud · +2 €/pza al cliente</span>
        </span>`;
      list.appendChild(wrap);
    });
    // Listener de validación max sustanciosos
    list.addEventListener("change", () => this.validateSignatures());
  },

  /** Pinta checkboxes de las estaciones showcooking */
  renderEstaciones() {
    const list = document.getElementById("estaciones-list");
    if (!list) return;
    const estaciones = this.data.Estaciones_Showcooking?.rows || [];
    list.innerHTML = "";
    // Filtra duplicados (la estación arroces tiene 2 filas: arrocero + ayudante)
    const seen = new Set();
    estaciones.forEach(e => {
      const key = e.estacion?.split(" - ")[0] || e.estacion;
      if (!key || seen.has(key)) return;
      seen.add(key);
      const wrap = Utils.el("label", "flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-stone-50");
      const consumo = e.consumo_pax ? `${e.consumo_pax} ${Utils.esc(e.unidad_consumo)}/pax` : "";
      wrap.innerHTML = `
        <input type="checkbox" name="estacion" value="${Utils.esc(key)}" class="mt-0.5">
        <span>
          <span class="block">${Utils.esc(key)}</span>
          <span class="block text-xs text-stone-500">${consumo}</span>
        </span>`;
      list.appendChild(wrap);
    });
  },

  /** Cuando cambia el pack, actualiza duración default y máx sustanciosos */
  bindPackChange() {
    const sel = document.getElementById("pack_coctel");
    const dur = document.querySelector('input[name="duracion_min"]');
    const packDefaults = { basic: 60, standard: 75, premium: 90 };
    sel.addEventListener("change", () => {
      const v = sel.value;
      if (packDefaults[v]) dur.value = packDefaults[v];
      this.validateSignatures();
    });
  },

  /** Valida límite de piezas sustanciosas en signatures según pack */
  validateSignatures() {
    const pack = document.getElementById("pack_coctel").value;
    const max = { basic: 1, standard: 2, premium: 3 }[pack] || 2;
    const checked = document.querySelectorAll('input[name="signature"]:checked');
    const canapes = this.data.Canapes_Coctel?.rows || [];
    let sustanciosos = 0;
    checked.forEach(cb => {
      const c = canapes.find(x => String(x.n) === String(cb.value));
      if (c?.tier_peso === "sustancioso") sustanciosos++;
    });
    const warn = document.getElementById("signatures-warning");
    if (sustanciosos > max) {
      warn.textContent = `Has marcado ${sustanciosos} piezas sustanciosas, pero el pack ${pack} permite máx ${max}. Reduce o cambia de pack para evitar saciedad excesiva.`;
      warn.classList.remove("hidden");
    } else {
      warn.classList.add("hidden");
    }
  },

  /** Listener submit del formulario */
  bindForm() {
    const form = document.getElementById("wizard-form");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const evento = this.collect();
      const id = this.save(evento);
      this.showResult(evento, id);
      Eventos.refresh();
    });

    // Validación pax mínimo según tipo
    form.addEventListener("input", e => {
      if (e.target.name === "pax" || e.target.name === "tipo_evento") {
        this.validatePax();
      }
    });
  },

  validatePax() {
    const pax = parseInt(document.querySelector('input[name="pax"]').value, 10);
    const tipo = document.querySelector('select[name="tipo_evento"]').value;
    const min = { coctel: 30, brasas: 20, arroces: 20 }[tipo] || 0;
    const w = document.getElementById("pax-warning");
    if (pax && min && pax < min) {
      w.textContent = `Mínimo ${min} pax para ${tipo}.`;
      w.classList.remove("hidden");
    } else {
      w.classList.add("hidden");
    }
  },

  /** Recoge los valores del formulario en un objeto evento */
  collect() {
    const fd = new FormData(document.getElementById("wizard-form"));
    const tipo = fd.get("tipo_evento");
    const signatures = Array.from(document.querySelectorAll('input[name="signature"]:checked')).map(c => parseInt(c.value, 10));
    const estaciones = Array.from(document.querySelectorAll('input[name="estacion"]:checked')).map(c => c.value);
    return {
      id: "ev_" + Date.now(),
      created: new Date().toISOString(),
      nombre: fd.get("nombre"),
      cliente: fd.get("cliente") || "",
      fecha: fd.get("fecha"),
      tipo_evento: tipo,
      pax: parseInt(fd.get("pax"), 10),
      duracion_min: parseInt(fd.get("duracion_min"), 10),
      // Pack según tipo (sólo el aplicable se persiste; los demás quedan undefined)
      pack_coctel:        tipo === "coctel"        ? fd.get("pack_coctel")        : null,
      pack_menu_sentado:  tipo === "menu_sentado"  ? fd.get("pack_menu_sentado")  : null,
      pack_coffee:        tipo === "coffee_break"  ? fd.get("pack_coffee")        : null,
      arroz_eleccion:     tipo === "arroces"       ? fd.get("arroz_eleccion")     : null,
      // Específicos cóctel
      tipo_coctel: tipo === "coctel" ? fd.get("tipo_coctel") : null,
      tipo_barra:  tipo === "coctel" ? fd.get("tipo_barra")  : null,
      signatures:  tipo === "coctel" ? signatures : [],
      estaciones:  tipo === "coctel" ? estaciones : [],
      // Comunes
      nivel_servicio: fd.get("nivel_servicio"),
      espacio: fd.get("espacio"),
      tipo_cliente: fd.get("tipo_cliente"),
      notas: fd.get("notas") || "",
    };
  },

  /** Guarda evento en localStorage */
  save(evento) {
    const eventos = State.get("eventos", []);
    eventos.push(evento);
    State.set("eventos", eventos);
    return evento.id;
  },

  showResult(evento, id) {
    const box = document.getElementById("wizard-result");
    document.getElementById("wizard-result-data").textContent = JSON.stringify(evento, null, 2);
    box.classList.remove("hidden");
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  },
};

window.Wizard = Wizard;
