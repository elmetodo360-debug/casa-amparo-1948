/* calculo.js — controlador de la vista #calculo/ev_XXX[/seccion] */

const Calculo = {
  SECTIONS: ["personal", "bebida", "comida", "escandallo", "orden_servicio", "orden_compra"],

  render(eventoId, seccion) {
    const eventos = State.get("eventos", []);
    const ev = eventos.find(x => x.id === eventoId);
    const info = document.getElementById("calculo-info");
    const sectionsEl = document.getElementById("calculo-sections");
    const tabsEl = document.getElementById("calculo-tabs");
    const contentEl = document.getElementById("calculo-content");

    if (!ev) {
      info.innerHTML = `<span class="text-red-600">Evento no encontrado.</span> <a href="#eventos" class="text-blue-600 hover:underline">Ir a eventos guardados</a>`;
      sectionsEl.classList.add("hidden");
      return;
    }

    const pack = ev.pack_coctel || ev.pack_menu_sentado || ev.pack_coffee || "";
    info.innerHTML = `
      <strong>${Utils.esc(ev.nombre)}</strong>
      ${ev.cliente ? ` · ${Utils.esc(ev.cliente)}` : ""}
      · ${Utils.esc(ev.fecha)}
      · ${Utils.esc(ev.tipo_evento)} ${Utils.esc(pack)}
      · ${ev.pax} pax
    `;

    sectionsEl.classList.remove("hidden");

    const active = this.SECTIONS.includes(seccion) ? seccion : "escandallo";
    this._renderTabs(tabsEl, eventoId, active);
    this._renderSection(contentEl, ev, active);
  },

  _renderTabs(el, eventoId, active) {
    const labels = {
      personal: "Personal",
      bebida: "Bebida",
      comida: "Comida",
      escandallo: "Escandallo + PVP",
      orden_servicio: "Orden de Servicio",
      orden_compra: "Orden de Compra",
    };
    el.innerHTML = this.SECTIONS.map(s => `
      <a href="#calculo/${Utils.esc(eventoId)}/${s}"
         class="px-3 py-2 text-sm border-b-2 ${active === s ? "border-[#870120] text-[#870120] font-medium" : "border-transparent text-stone-600 hover:text-stone-900"}">
        ${labels[s]}
      </a>
    `).join("");
  },

  _renderSection(el, ev, seccion) {
    if (seccion === "personal")        el.innerHTML = CalcPersonal.render(ev);
    else if (seccion === "bebida")     el.innerHTML = CalcBebida.render(ev);
    else if (seccion === "comida")     el.innerHTML = CalcComida.render(ev);
    else if (seccion === "escandallo") el.innerHTML = CalcEscandallo.render(ev);
    else if (seccion === "orden_servicio") el.innerHTML = GenOrdenServicio.render(ev);
    else if (seccion === "orden_compra")   el.innerHTML = GenOrdenCompra.render(ev);
    else el.innerHTML = "";
  },
};

window.Calculo = Calculo;
