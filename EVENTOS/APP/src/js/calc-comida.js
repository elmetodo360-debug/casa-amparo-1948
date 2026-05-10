/* calc-comida.js — Sprint 5: cálculo de comida (canapés cóctel) */

const CalcComida = {
  data: null,
  PACK_COMP: {
    basic:    { F: 5, C: 3, postre: 1, var_F: 4, var_C: 3 },
    standard: { F: 6, C: 5, postre: 1, var_F: 6, var_C: 4 },
    premium:  { F: 8, C: 7, postre: 1, var_F: 8, var_C: 6 },
  },

  init(appData) { this.data = appData; },

  calculate(evento) {
    if (evento.tipo_evento !== "coctel") {
      return { pendiente: true, tipo: evento.tipo_evento, costeTotal: 0, eurPax: 0 };
    }
    const canapes = this.data.Canapes_Coctel?.rows || [];
    const globales = this._globalesMap();
    const merma = parseFloat(globales.merma_canapes) || 0.10;
    const mermaPostre = parseFloat(globales.merma_postre) || 0.05;
    const restaPorEstacion = parseFloat(globales.estacion_resta_piezas_coctel) || 1;

    const pack = evento.pack_coctel || "standard";
    const comp = this.PACK_COMP[pack];
    const pax = evento.pax;
    const numEst = (evento.estaciones || []).length;
    const restaTotal = numEst * restaPorEstacion;
    // Distribuir resta proporcionalmente entre frio y caliente
    const restaF = Math.ceil(restaTotal * (comp.F / (comp.F + comp.C)));
    const restaC = restaTotal - restaF;

    const F = Math.max(0, comp.F - restaF);
    const C = Math.max(0, comp.C - restaC);

    // Signatures: cuántas son frías y cuántas calientes
    const sigList = (evento.signatures || []).map(n => canapes.find(c => c.n === n)).filter(Boolean);
    const sigFrios = sigList.filter(c => c.tipo === "frio").length;
    const sigCalientes = sigList.filter(c => c.tipo === "caliente").length;

    // Coste medio fríos/calientes BASE (excluye signature y postre)
    const friosBase = canapes.filter(c => c.tipo === "frio" && c.categoria === "base");
    const calBase = canapes.filter(c => c.tipo === "caliente" && c.categoria === "base");
    const cmFrio = this._avg(friosBase.map(c => c.coste_ud));
    const cmCal = this._avg(calBase.map(c => c.coste_ud));

    // Piezas base (excluyendo las que reemplazan signatures)
    const piezasFrioBaseTotal = Math.max(0, F - sigFrios) * pax * (1 + merma);
    const piezasCalBaseTotal  = Math.max(0, C - sigCalientes) * pax * (1 + merma);

    const costeFrioBase = piezasFrioBaseTotal * cmFrio;
    const costeCalBase  = piezasCalBaseTotal * cmCal;

    // Coste signature (cada pieza × pax × merma)
    const costeSignature = sigList.reduce((s, p) => s + (p.coste_ud || 0) * pax * (1 + merma), 0);
    const piezasSig = sigList.length * pax * (1 + merma);

    // Postre
    const brownie = canapes.find(c => c.tipo === "postre");
    const piezasPostre = comp.postre * pax * (1 + mermaPostre);
    const costePostre = piezasPostre * (brownie?.coste_ud || 0.40);

    // Coste consumo signature al cliente: +2 €/pza × pax × nº signatures
    const recargo = parseFloat(globales.signature_recargo_pieza) || 2.0;
    const ingresoExtraSignature = sigList.length * recargo * pax;

    const costeTotal = costeFrioBase + costeCalBase + costeSignature + costePostre;
    const eurPax = pax > 0 ? costeTotal / pax : 0;

    return {
      pack, pax, comp,
      F_efectivo: F, C_efectivo: C,
      sigFrios, sigCalientes, numEst,
      piezas: {
        frio_base: Math.round(piezasFrioBaseTotal),
        caliente_base: Math.round(piezasCalBaseTotal),
        signature: Math.round(piezasSig),
        postre: Math.round(piezasPostre),
      },
      coste_medio_frio: cmFrio,
      coste_medio_caliente: cmCal,
      lines: [
        { concepto: `Fríos base (mix recomendado)`, piezas: Math.round(piezasFrioBaseTotal), coste_ud: cmFrio, coste: costeFrioBase, nota: `${F - sigFrios} variedades × ${pax} pax × merma ${(merma*100).toFixed(0)}%` },
        { concepto: `Calientes base (mix recomendado)`, piezas: Math.round(piezasCalBaseTotal), coste_ud: cmCal, coste: costeCalBase, nota: `${C - sigCalientes} variedades × ${pax} pax × merma ${(merma*100).toFixed(0)}%` },
        ...(sigList.length > 0 ? [{ concepto: `Signature (${sigList.length} piezas seleccionadas)`, piezas: Math.round(piezasSig), coste_ud: this._avg(sigList.map(c => c.coste_ud)), coste: costeSignature, nota: sigList.map(c => c.nombre).join(", ") }] : []),
        { concepto: `Postre (${brownie?.nombre || "Mini brownie"})`, piezas: Math.round(piezasPostre), coste_ud: brownie?.coste_ud || 0.40, coste: costePostre, nota: `${comp.postre} ud/pax × ${pax} pax × merma ${(mermaPostre*100).toFixed(0)}%` },
      ],
      costeTotal, eurPax,
      ingresoExtraSignature,
      restaTotal, restaF, restaC,
    };
  },

  _avg(arr) {
    const valid = arr.filter(v => typeof v === "number" && !isNaN(v));
    return valid.length === 0 ? 0 : valid.reduce((s, v) => s + v, 0) / valid.length;
  },

  _globalesMap() {
    const g = this.data.Globales?.rows || [];
    const m = {};
    g.forEach(r => { m[r.parametro] = r.valor; });
    return m;
  },

  render(evento) {
    const r = this.calculate(evento);
    if (r.pendiente) {
      return `
        <div class="mb-3"><h3 class="font-semibold text-stone-700">Comida</h3></div>
        <div class="bg-amber-50 border border-amber-200 rounded p-4 text-sm">
          <p><strong>Cálculo de comida pendiente para tipo "${Utils.esc(r.tipo)}".</strong></p>
          <p class="text-xs text-stone-600 mt-2">Cocina debe cerrar los escandallos en el Sheet (pestaña Menus_Sentados / Coffee_Breaks). Cuando estén todos los costes rellenos, se actualiza este módulo y se calcula automáticamente.</p>
        </div>`;
    }
    const totalPiezas = r.piezas.frio_base + r.piezas.caliente_base + r.piezas.signature + r.piezas.postre;
    let html = `
      <div class="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-stone-700">Comida</h3>
        <p class="text-xs text-stone-500">
          Pack ${r.pack} · ${r.F_efectivo}F + ${r.C_efectivo}C${r.restaTotal > 0 ? ` (–${r.restaTotal} por ${r.numEst} estación${r.numEst>1?"es":""})` : ""} · ${totalPiezas} piezas totales producción
        </p>
      </div>
      <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-100 text-xs uppercase text-stone-600">
          <tr>
            <th class="text-left px-2 py-2">Concepto</th>
            <th class="text-right px-2 py-2">Piezas (con merma)</th>
            <th class="text-right px-2 py-2">€/ud medio</th>
            <th class="text-right px-2 py-2">Coste</th>
          </tr>
        </thead>
        <tbody>`;
    r.lines.forEach(l => {
      html += `
        <tr class="border-t border-stone-200">
          <td class="px-2 py-2">
            <div>${Utils.esc(l.concepto)}</div>
            <div class="text-xs text-stone-500">${Utils.esc(l.nota)}</div>
          </td>
          <td class="px-2 py-2 text-right">${l.piezas}</td>
          <td class="px-2 py-2 text-right">${Utils.fmtEur(l.coste_ud, 2)}</td>
          <td class="px-2 py-2 text-right font-medium">${Utils.fmtEur(l.coste, 2)}</td>
        </tr>`;
    });
    html += `
        <tr class="border-t-2 border-stone-400 bg-stone-100 font-semibold">
          <td class="px-2 py-2">Total comida</td>
          <td class="px-2 py-2 text-right">${totalPiezas}</td>
          <td class="px-2 py-2 text-right text-stone-600">${Utils.fmtEur(r.eurPax, 2)} /pax</td>
          <td class="px-2 py-2 text-right text-[#870120]">${Utils.fmtEur(r.costeTotal, 2)}</td>
        </tr>
      </tbody></table></div>`;
    if (r.ingresoExtraSignature > 0) {
      html += `<p class="text-xs text-stone-600 mt-2">Ingreso extra cliente por ${r.sigFrios + r.sigCalientes} signatures × +2 €/pza × ${r.pax} pax = <strong>${Utils.fmtEur(r.ingresoExtraSignature, 2)}</strong></p>`;
    }
    return html;
  },
};

window.CalcComida = CalcComida;
