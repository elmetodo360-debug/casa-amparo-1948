/* calc-escandallo.js — Sprint 6: escandallo total + PVP + margen */

const CalcEscandallo = {
  data: null,

  init(appData) { this.data = appData; },

  calculate(evento) {
    const globales = this._globalesMap();
    const personal = CalcPersonal.calculate(evento);
    const comida = CalcComida.calculate(evento);
    const bebida = CalcBebida.calculate(evento);

    // PVP cliente — clave del global según tipo de evento
    const pvpKey = this._pvpKey(evento);
    let pvpPax = pvpKey ? (parseFloat(globales[pvpKey]) || 0) : 0;
    // Caso especial coffee break: precios fijos por pack (no en globales)
    if (evento.tipo_evento === "coffee_break") {
      pvpPax = ({ wellcome: 9, basico: 12, break: 15, espanol: 18, frances: 18 }[evento.pack_coffee] || 12);
    }
    const pvpBase = pvpPax * evento.pax;
    const pvpSignatures = (evento.tipo_evento === "coctel")
      ? (evento.signatures?.length || 0) * (parseFloat(globales.signature_recargo_pieza) || 2.0) * evento.pax
      : 0;
    let pvpBarra = 0;
    if (evento.tipo_barra === "silver") {
      pvpBarra = (parseFloat(globales.pvp_barra_silver_2h) || 21) * evento.pax;
    } else if (evento.tipo_barra === "gold") {
      pvpBarra = (parseFloat(globales.pvp_barra_gold_2h) || 30) * evento.pax;
    }
    const pvpTotal = pvpBase + pvpSignatures + pvpBarra;

    // Coste total
    const costePersonal = personal.total;
    const costeComida = comida.costeTotal;
    const costeBebida = 0; // no escandallado todavía
    const subtotal = costePersonal + costeComida + costeBebida;

    // Estructura + imprevistos sobre subtotal
    const pctEstructura = 0.06;
    const pctImprevistos = 0.04;
    const costeEstructura = subtotal * pctEstructura;
    const costeImprevistos = subtotal * pctImprevistos;

    const costeTotal = subtotal + costeEstructura + costeImprevistos;

    // Margen
    const margen = pvpTotal - costeTotal;
    const margenPct = pvpTotal > 0 ? margen / pvpTotal : 0;

    // Food cost real (comida / pvp_base, target 24% cóctel)
    const targetFC = parseFloat(globales.food_cost_target_coctel) || 0.24;
    const foodCost = pvpBase > 0 ? costeComida / pvpBase : 0;

    return {
      personal: { total: costePersonal, eurPax: personal.eurPax, personasTotal: personal.personasTotal, horasFact: personal.horasFact },
      comida: { total: costeComida, eurPax: comida.eurPax },
      bebida: { incluida: bebida.barraPaquete ? `Barra ${bebida.tipo}` : "En PVP del pack" },
      subtotal,
      costeEstructura, pctEstructura,
      costeImprevistos, pctImprevistos,
      costeTotal,
      eurPaxCoste: evento.pax > 0 ? costeTotal / evento.pax : 0,
      pvp: { base: pvpBase, signatures: pvpSignatures, barra: pvpBarra, total: pvpTotal, eurPax: evento.pax > 0 ? pvpTotal / evento.pax : 0 },
      margen, margenPct,
      foodCost, targetFC,
    };
  },

  _pvpKey(evento) {
    // Mapea tipo + pack al parámetro pvp_* en Globales
    const t = evento.tipo_evento;
    if (t === "coctel")        return `pvp_${evento.pack_coctel || "standard"}`;
    if (t === "menu_sentado")  return `pvp_menu_${evento.pack_menu_sentado || "casa"}`;
    if (t === "brasas")        return "pvp_menu_brasas";
    if (t === "arroces")       return "pvp_menu_arroces";
    if (t === "coffee_break")  {
      // Globales tiene pvp_basic, pvp_standard, pvp_premium para cóctel.
      // Para coffee no hay un key directo; calcula desde el pack:
      const map = { wellcome: 9, basico: 12, break: 15, espanol: 18, frances: 18 };
      const v = map[evento.pack_coffee] || 12;
      return null; // se gestiona aparte abajo
    }
    return "pvp_basic";
  },

  _globalesMap() {
    const g = this.data.Globales?.rows || [];
    const m = {};
    g.forEach(r => { m[r.parametro] = r.valor; });
    return m;
  },

  render(evento) {
    const r = this.calculate(evento);
    const comidaPendiente = r.comida.total === 0 && evento.tipo_evento !== "coctel";
    const semaforoMargen = r.margenPct >= 0.65 ? "text-green-700" : r.margenPct >= 0.50 ? "text-amber-700" : "text-red-700";
    const semaforoFC = comidaPendiente ? "text-stone-400" : r.foodCost <= r.targetFC ? "text-green-700" : r.foodCost <= r.targetFC * 1.1 ? "text-amber-700" : "text-red-700";

    return `
      <div class="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-stone-700">Escandallo total · PVP · Margen</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- Costes -->
        <div class="bg-stone-50 border border-stone-200 rounded p-4">
          <h4 class="font-semibold text-sm text-stone-700 mb-3">Costes</h4>
          <table class="w-full text-sm">
            <tbody>
              <tr><td class="py-1">Personal (${r.personal.personasTotal} pers · ${r.personal.horasFact}h)</td><td class="text-right py-1">${Utils.fmtEur(r.personal.total)}</td></tr>
              <tr><td class="py-1">Comida (cóctel + postre)</td><td class="text-right py-1">${Utils.fmtEur(r.comida.total)}</td></tr>
              <tr><td class="py-1 text-stone-500 italic">Bebida — ${Utils.esc(r.bebida.incluida)}</td><td class="text-right py-1 text-stone-500">—</td></tr>
              <tr class="border-t border-stone-300"><td class="py-1 font-medium">Subtotal directo</td><td class="text-right py-1 font-medium">${Utils.fmtEur(r.subtotal)}</td></tr>
              <tr><td class="py-1 text-stone-600">+ Estructura (${(r.pctEstructura*100).toFixed(0)} %)</td><td class="text-right py-1">${Utils.fmtEur(r.costeEstructura)}</td></tr>
              <tr><td class="py-1 text-stone-600">+ Imprevistos (${(r.pctImprevistos*100).toFixed(0)} %)</td><td class="text-right py-1">${Utils.fmtEur(r.costeImprevistos)}</td></tr>
              <tr class="border-t-2 border-stone-400"><td class="py-2 font-bold">Coste total evento</td><td class="text-right py-2 font-bold text-[#870120]">${Utils.fmtEur(r.costeTotal)}</td></tr>
              <tr><td class="py-1 text-xs text-stone-500">Coste / pax</td><td class="text-right py-1 text-xs text-stone-500">${Utils.fmtEur(r.eurPaxCoste)} /pax</td></tr>
            </tbody>
          </table>
        </div>

        <!-- PVP cliente -->
        <div class="bg-amber-50/40 border border-amber-200 rounded p-4">
          <h4 class="font-semibold text-sm text-stone-700 mb-3">PVP cliente</h4>
          <table class="w-full text-sm">
            <tbody>
              <tr><td class="py-1">Pack base × pax</td><td class="text-right py-1">${Utils.fmtEur(r.pvp.base)}</td></tr>
              <tr><td class="py-1">Signatures (+2 €/pza × pax)</td><td class="text-right py-1">${Utils.fmtEur(r.pvp.signatures)}</td></tr>
              <tr><td class="py-1">Barra Silver/Gold</td><td class="text-right py-1">${Utils.fmtEur(r.pvp.barra)}</td></tr>
              <tr class="border-t-2 border-amber-300"><td class="py-2 font-bold">PVP total cliente (sin IVA)</td><td class="text-right py-2 font-bold text-[#870120]">${Utils.fmtEur(r.pvp.total)}</td></tr>
              <tr><td class="py-1 text-xs text-stone-500">PVP / pax</td><td class="text-right py-1 text-xs text-stone-500">${Utils.fmtEur(r.pvp.eurPax)} /pax</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Margen + Food cost -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="bg-white border border-stone-300 rounded p-4">
          <h4 class="font-semibold text-sm text-stone-700 mb-2">Margen bruto</h4>
          <div class="text-3xl font-bold ${semaforoMargen}">${Utils.fmtEur(r.margen)}</div>
          <div class="text-sm ${semaforoMargen}">${(r.margenPct*100).toFixed(1)} % sobre PVP</div>
          <p class="text-xs text-stone-500 mt-2">Verde ≥ 65 % · Ámbar 50-65 % · Rojo < 50 %</p>
        </div>
        <div class="bg-white border border-stone-300 rounded p-4">
          <h4 class="font-semibold text-sm text-stone-700 mb-2">Food cost real</h4>
          <div class="text-3xl font-bold ${semaforoFC}">${comidaPendiente ? "—" : (r.foodCost*100).toFixed(1) + " %"}</div>
          <div class="text-sm text-stone-500">Target MIKE: ${(r.targetFC*100).toFixed(0)} %</div>
          <p class="text-xs text-stone-500 mt-2">${comidaPendiente ? "Pendiente: cocina debe cerrar escandallos en el Sheet para calcular food cost." : "Solo comida sobre PVP base (sin signatures ni barra). Verde ≤ target · Ámbar ≤ target+10 % · Rojo > target+10 %"}</p>
        </div>
      </div>
    `;
  },
};

window.CalcEscandallo = CalcEscandallo;
