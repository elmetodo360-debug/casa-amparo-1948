/* calc-bebida.js — Sprint 4: cálculo de bebida (cantidades a comprar) */

const CalcBebida = {
  data: null,

  ENVASES: {
    agua:      { envase: "Botellín agua 50 cl", servicios_envase: 1.5,  factor_envase: 0.50 },
    refresco:  { envase: "Botellín refresco 20 cl", servicios_envase: 1, factor_envase: 0.20 },
    cerveza:   { envase: "Tercio cerveza 33 cl", servicios_envase: 1,    factor_envase: 0.33 },
    vino:      { envase: "Botella vino 75 cl",  servicios_envase: 5.5,   factor_envase: 0.75 },
    cava:      { envase: "Botella cava 75 cl",  servicios_envase: 6.5,   factor_envase: 0.75 },
    destilado: { envase: "Botella destilado 70 cl", servicios_envase: 15, factor_envase: 0.70 },
  },

  init(appData) { this.data = appData; },

  calculate(evento) {
    // Para tipos que no son cóctel, la bebida va incluida en el PVP del pack del menú
    if (evento.tipo_evento !== "coctel") {
      return { incluidaEnPack: true, tipo_evento: evento.tipo_evento };
    }
    const beb = this.data.Bebida?.rows || [];
    const globales = this._globalesMap();

    // Si barra Silver/Gold, no se calcula bebida individual (es paquete cerrado)
    if (evento.tipo_barra === "silver" || evento.tipo_barra === "gold") {
      return { barraPaquete: true, tipo: evento.tipo_barra };
    }

    // Bebidas/pax acumulado según duración
    const horas = (evento.duracion_min || 75) / 60;
    const bebidasPax = this._bebidasPaxAcumulado(beb, horas);

    // Mix
    const mix = this._mixAjustado(beb, evento.tipo_barra);

    // Merma
    const merma = parseFloat(globales.merma_bebida) || 0.10;

    // Total bebidas
    const totalBebidas = evento.pax * bebidasPax * (1 + merma);

    // Por categoría
    const lines = [];
    Object.entries(mix).forEach(([cat, pct]) => {
      if (pct <= 0) return;
      const env = this.ENVASES[cat];
      if (!env) return;
      const servicios = totalBebidas * (pct / 100);
      const envases = Math.ceil(servicios / env.servicios_envase);
      const litros = envases * env.factor_envase;
      lines.push({
        categoria: cat,
        pct,
        servicios: Math.round(servicios),
        envase: env.envase,
        envases,
        litros: litros.toFixed(2),
      });
    });

    return {
      barraPaquete: false,
      horas,
      bebidasPax: bebidasPax.toFixed(2),
      totalBebidas: Math.round(totalBebidas),
      merma,
      lines,
    };
  },

  _bebidasPaxAcumulado(bebTable, horas) {
    const acum = bebTable.filter(r => r.seccion === "acumulado");
    const target = Math.max(1, Math.min(4, Math.ceil(horas)));
    const minR = acum.find(r => r.clave === `${target}h_min`);
    const maxR = acum.find(r => r.clave === `${target}h_max`);
    if (minR && maxR) {
      return (parseFloat(minR.valor) + parseFloat(maxR.valor)) / 2;
    }
    return horas * 2;
  },

  _mixAjustado(bebTable, tipoBarra) {
    const mix = {};
    bebTable.filter(r => r.seccion === "mix_estandar").forEach(r => {
      const cat = r.clave.replace("_pct", "");
      mix[cat] = parseFloat(r.valor) || 0;
    });
    // Sin destilados: redistribuir
    if (tipoBarra === "basica") {
      const dest = mix.destilado || 0;
      mix.destilado = 0;
      mix.cerveza = (mix.cerveza || 0) + dest * 0.5;
      mix.vino = (mix.vino || 0) + dest * 0.3;
      mix.refresco = (mix.refresco || 0) + dest * 0.2;
    }
    return mix;
  },

  _globalesMap() {
    const g = this.data.Globales?.rows || [];
    const m = {};
    g.forEach(r => { m[r.parametro] = r.valor; });
    return m;
  },

  render(evento) {
    const r = this.calculate(evento);
    if (r.incluidaEnPack) {
      return `
        <div class="mb-3"><h3 class="font-semibold text-stone-700">Bebida</h3></div>
        <div class="bg-stone-50 border border-stone-200 rounded p-4 text-sm">
          <p>La bebida está <strong>incluida en el PVP del pack ${Utils.esc(r.tipo_evento)}</strong> (vino tinto/blanco D.O., cerveza Mahou, refrescos, agua con/sin gas).</p>
          <p class="text-xs text-stone-500 mt-1">Cantidades a comprar las gestiona barra/cocina según consumo histórico del local. La calculadora detallada de envases solo aplica a cócteles de barra abierta.</p>
        </div>`;
    }
    if (r.barraPaquete) {
      return `
        <div class="mb-3">
          <h3 class="font-semibold text-stone-700">Bebida</h3>
        </div>
        <div class="bg-stone-50 border border-stone-200 rounded p-4 text-sm">
          <p>Barra <strong>${r.tipo === "silver" ? "Silver" : "Gold"}</strong> contratada como paquete cerrado.</p>
          <p class="text-xs text-stone-500 mt-1">PVP cliente: ${r.tipo === "silver" ? "21 €/pax/2h" : "30 €/pax/2h"} · Cálculo de envases lo gestiona cocina/barra. Para ver desglose de envases, cambia tipo de barra a Básica o Estándar en el evento.</p>
        </div>`;
    }
    let html = `
      <div class="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-stone-700">Bebida</h3>
        <p class="text-xs text-stone-500">
          ${evento.pax} pax × ${r.bebidasPax} bebidas/pax (${r.horas.toFixed(2)}h) · merma ${(r.merma*100).toFixed(0)}% · <strong>${r.totalBebidas}</strong> bebidas totales
        </p>
      </div>
      <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-100 text-xs uppercase text-stone-600">
          <tr>
            <th class="text-left px-2 py-2">Categoría</th>
            <th class="text-right px-2 py-2">Mix %</th>
            <th class="text-right px-2 py-2">Servicios</th>
            <th class="text-left px-2 py-2">Envase</th>
            <th class="text-right px-2 py-2">Envases a comprar</th>
            <th class="text-right px-2 py-2">Litros</th>
          </tr>
        </thead>
        <tbody>`;
    r.lines.forEach(l => {
      html += `
        <tr class="border-t border-stone-200">
          <td class="px-2 py-2 capitalize">${Utils.esc(l.categoria)}</td>
          <td class="px-2 py-2 text-right text-stone-500">${l.pct.toFixed(0)} %</td>
          <td class="px-2 py-2 text-right">${l.servicios}</td>
          <td class="px-2 py-2 text-xs">${Utils.esc(l.envase)}</td>
          <td class="px-2 py-2 text-right font-medium">${l.envases}</td>
          <td class="px-2 py-2 text-right text-stone-500">${l.litros}</td>
        </tr>`;
    });
    html += `</tbody></table></div>
      <p class="text-xs text-stone-500 mt-2">Cantidades para comprar (no se calcula coste de bebida en esta versión — pendiente catálogo de proveedores en pestaña Bebida_Costes).</p>`;
    return html;
  },
};

window.CalcBebida = CalcBebida;
