/* calc-personal.js — Sprint 3: cálculo de personal según evento */

const CalcPersonal = {
  data: null,

  init(appData) {
    this.data = appData;
  },

  /** Calcula personal para un evento. Devuelve {lines, total, personasTotal, eurPax, horasFact} */
  calculate(evento) {
    const ratios = this.data.Ratios_Personal?.rows || [];
    const tarifas = this.data.Tarifas_Personal?.rows || [];
    const estaciones = this.data.Estaciones_Showcooking?.rows || [];

    const filteredRatios = ratios.filter(r => r.tipo_evento === evento.tipo_evento);
    const horasFact = this._horasFacturadas(evento);

    const lines = [];
    filteredRatios.forEach(r => {
      const personas = this._personasFromRatio(r, evento.pax);
      const tier = this._tierFromPuesto(r.puesto);
      const eurH = this._costeHora(tarifas, tier);
      const coste = personas * eurH * horasFact;
      lines.push({
        puesto: r.puesto,
        ratio: this._ratioDescription(r),
        personas,
        tier,
        eur_h: eurH,
        horas: horasFact,
        coste,
        origen: "base",
      });
    });

    // Personal extra por estaciones
    if (evento.estaciones && evento.estaciones.length > 0) {
      evento.estaciones.forEach(estName => {
        // Una estación puede tener múltiples filas (ej: arroces tiene arrocero + ayudante)
        estaciones.forEach(e => {
          const key = (e.estacion || "").split(" - ")[0].trim();
          if (key !== estName.trim()) return;
          if (!e.personal_extra_puesto || e.personal_extra_puesto === "") return;
          const tier = e.personal_extra_tier || "base";
          const eurH = this._costeHora(tarifas, tier);
          const horas = parseFloat(e.personal_extra_horas) || 4;
          const personas = 1;
          lines.push({
            puesto: `${e.personal_extra_puesto} (est. ${estName})`,
            ratio: "fijo por estación",
            personas,
            tier,
            eur_h: eurH,
            horas,
            coste: personas * eurH * horas,
            origen: "estacion",
          });
        });
      });
    }

    const total = lines.reduce((s, l) => s + l.coste, 0);
    const personasTotal = lines.reduce((s, l) => s + l.personas, 0);
    const eurPax = evento.pax > 0 ? total / evento.pax : 0;

    return { lines, total, personasTotal, eurPax, horasFact };
  },

  /* --- Helpers internos --- */

  _personasFromRatio(r, pax) {
    if (r.tipo_ratio === "fijo") return parseInt(r.valor, 10) || 1;
    if (r.tipo_ratio === "pax_por_persona") {
      const v = parseFloat(r.valor) || 1;
      return Math.max(1, Math.ceil(pax / v));
    }
    if (r.tipo_ratio === "tramos") {
      // valor format: "1 hasta 60 / 2 hasta 120 / 3 hasta 200"
      const tramos = String(r.valor).split("/").map(s => s.trim());
      for (const t of tramos) {
        const m = t.match(/^(\d+)\s*hasta\s*(\d+)$/i);
        if (m && pax <= parseInt(m[2], 10)) return parseInt(m[1], 10);
      }
      // fallback: último tramo
      const last = tramos[tramos.length - 1] || "1";
      const m = last.match(/^(\d+)/);
      return m ? parseInt(m[1], 10) : 1;
    }
    return 1;
  },

  _tierFromPuesto(puesto) {
    const jefes = ["maitre", "jefe_cocina", "jefe_barra", "brasero", "arrocero"];
    const especialistas = ["cortador", "sushiman", "pulpeiro"];
    if (jefes.includes(puesto)) return "jefe";
    if (especialistas.includes(puesto)) return "especialista";
    return "base";
  },

  _costeHora(tarifas, tier) {
    const t = tarifas.find(x => x.tier === tier);
    return t?.eur_h_CA ?? (tier === "jefe" || tier === "especialista" ? 15 : 12);
  },

  _horasFacturadas(evento) {
    const dur = (evento.duracion_min || 75) / 60;
    const total = dur + 2; // 1h montaje + 1h desmontaje
    return Math.max(4, Math.ceil(total));
  },

  _ratioDescription(r) {
    if (r.tipo_ratio === "fijo") return "Fijo";
    if (r.tipo_ratio === "pax_por_persona") return `1 / ${r.valor} pax`;
    if (r.tipo_ratio === "tramos") return r.valor;
    return r.tipo_ratio;
  },

  /* --- Render --- */

  render(evento) {
    const result = this.calculate(evento);
    const dur_h = (evento.duracion_min / 60).toFixed(2);
    let html = `
      <div class="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-stone-700">Personal</h3>
        <p class="text-xs text-stone-500">
          ${evento.pax} pax · servicio ${dur_h}h · facturadas ${result.horasFact}h (incluye montaje/desmontaje, mín 4h convenio)
        </p>
      </div>
      <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-100 text-xs uppercase text-stone-600">
          <tr>
            <th class="text-left px-2 py-2">Puesto</th>
            <th class="text-left px-2 py-2">Ratio</th>
            <th class="text-right px-2 py-2">Personas</th>
            <th class="text-left px-2 py-2">Tier</th>
            <th class="text-right px-2 py-2">€/h</th>
            <th class="text-right px-2 py-2">Horas</th>
            <th class="text-right px-2 py-2">Coste</th>
          </tr>
        </thead>
        <tbody>`;
    result.lines.forEach(l => {
      const rowCls = l.origen === "estacion" ? "bg-amber-50/40" : "";
      html += `
        <tr class="border-t border-stone-200 ${rowCls}">
          <td class="px-2 py-2">${Utils.esc(l.puesto)}</td>
          <td class="px-2 py-2 text-xs text-stone-500">${Utils.esc(l.ratio)}</td>
          <td class="px-2 py-2 text-right">${l.personas}</td>
          <td class="px-2 py-2 text-xs">${Utils.esc(l.tier)}</td>
          <td class="px-2 py-2 text-right">${Utils.fmtEur(l.eur_h, 2)}</td>
          <td class="px-2 py-2 text-right">${l.horas}</td>
          <td class="px-2 py-2 text-right font-medium">${Utils.fmtEur(l.coste, 2)}</td>
        </tr>`;
    });
    html += `
        <tr class="border-t-2 border-stone-400 bg-stone-100 font-semibold">
          <td colspan="2" class="px-2 py-2">Total personal</td>
          <td class="px-2 py-2 text-right">${result.personasTotal}</td>
          <td colspan="3" class="px-2 py-2 text-right text-stone-600">${Utils.fmtEur(result.eurPax, 2)} /pax</td>
          <td class="px-2 py-2 text-right text-[#870120]">${Utils.fmtEur(result.total, 2)}</td>
        </tr>
      </tbody></table></div>`;
    if (result.lines.some(l => l.origen === "estacion")) {
      html += `<p class="text-xs text-stone-500 mt-2">Filas con fondo claro = personal extra por estaciones showcooking.</p>`;
    }
    return html;
  },
};

window.CalcPersonal = CalcPersonal;
