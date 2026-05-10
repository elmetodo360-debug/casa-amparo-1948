/* gen-orden-compra.js — Sprint 8: Orden de Compra (lista compra agrupada) */

const GenOrdenCompra = {
  data: null,
  init(appData) { this.data = appData; },

  generate(evento) {
    const comida = CalcComida.calculate(evento);
    const bebida = CalcBebida.calculate(evento);
    const estaciones = this._estacionesDetail(evento);

    return { evento, comida, bebida, estaciones };
  },

  _estacionesDetail(evento) {
    const estaciones = this.data.Estaciones_Showcooking?.rows || [];
    const seleccionadas = evento.estaciones || [];
    return seleccionadas.map(name => {
      const e = estaciones.find(x => (x.estacion || "").split(" - ")[0].trim() === name.trim());
      if (!e) return { name, consumo: "—", cantidad: "—", unidad: "—" };
      const consumoPax = parseFloat(e.consumo_pax) || 0;
      const totalConMerma = consumoPax * evento.pax * 1.10;
      return {
        name,
        consumoPax,
        unidad: e.unidad_consumo,
        cantidad: totalConMerma.toFixed(consumoPax < 5 ? 1 : 0),
      };
    });
  },

  render(evento) {
    const r = this.generate(evento);
    let html = `
      <div class="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-stone-700">Orden de Compra</h3>
        <button onclick="window.print()" class="text-xs px-3 py-1 border border-stone-300 rounded hover:bg-stone-100 print:hidden">Imprimir / Guardar PDF</button>
      </div>

      <div class="printable bg-white border border-stone-200 rounded p-6">
        <div class="text-center mb-6 print:mb-4">
          <div class="text-xs uppercase tracking-wider text-stone-500">Casa Amparo 1948</div>
          <div class="text-2xl font-bold text-[#870120]">Orden de Compra</div>
          <div class="text-sm text-stone-600 mt-1">${Utils.esc(evento.nombre)} · ${Utils.esc(evento.fecha)} · ${evento.pax} pax</div>
        </div>

        <h4 class="font-semibold text-sm uppercase tracking-wider text-stone-600 border-b border-stone-300 pb-1 mb-3">Cocina · Producción canapés (con merma)</h4>`;
    if (r.comida.pendiente) {
      html += `<p class="text-sm text-amber-700 mb-6">Cálculo de comida pendiente para tipo "${Utils.esc(r.comida.tipo)}". Cuando cocina cierre los escandallos en el Sheet, esta sección se completará automáticamente.</p>`;
    } else {
      html += `
        <table class="w-full text-sm mb-6">
          <thead class="text-xs uppercase text-stone-600">
            <tr><th class="text-left py-1 pr-2">Categoría</th><th class="text-right py-1 px-2">Piezas</th><th class="text-left py-1 pl-2">Detalle</th></tr>
          </thead>
          <tbody>`;
      r.comida.lines.forEach(l => {
        html += `
            <tr class="border-b border-stone-100">
              <td class="py-1 pr-2">${Utils.esc(l.concepto)}</td>
              <td class="py-1 px-2 text-right font-medium">${l.piezas}</td>
              <td class="py-1 pl-2 text-xs text-stone-500">${Utils.esc(l.nota)}</td>
            </tr>`;
      });
      html += `
          </tbody>
        </table>`;
    }

        <h4 class="font-semibold text-sm uppercase tracking-wider text-stone-600 border-b border-stone-300 pb-1 mb-3">Bebida · Envases a comprar</h4>`;
    if (r.bebida.incluidaEnPack) {
      html += `<p class="text-sm text-stone-600 mb-6">Bebida incluida en el PVP del pack del menú (vino, cerveza, refrescos, agua). Cantidades gestionadas por barra/cocina según consumo histórico.</p>`;
    } else if (r.bebida.barraPaquete) {
      html += `<p class="text-sm text-stone-600 mb-6">Barra ${r.bebida.tipo} contratada como paquete cerrado. Compra gestionada por proveedor de barra externa o cocina/barra CA según acuerdo.</p>`;
    } else {
      html += `
        <table class="w-full text-sm mb-6">
          <thead class="text-xs uppercase text-stone-600">
            <tr><th class="text-left py-1 pr-2">Categoría</th><th class="text-left py-1 px-2">Envase</th><th class="text-right py-1 px-2">Cantidad</th><th class="text-right py-1 pl-2">Litros</th></tr>
          </thead>
          <tbody>`;
      r.bebida.lines.forEach(l => {
        html += `
            <tr class="border-b border-stone-100">
              <td class="py-1 pr-2 capitalize">${Utils.esc(l.categoria)}</td>
              <td class="py-1 px-2">${Utils.esc(l.envase)}</td>
              <td class="py-1 px-2 text-right font-medium">${l.envases}</td>
              <td class="py-1 pl-2 text-right text-stone-500">${l.litros}</td>
            </tr>`;
      });
      html += `</tbody></table>`;
    }

    if (r.estaciones.length > 0) {
      html += `
        <h4 class="font-semibold text-sm uppercase tracking-wider text-stone-600 border-b border-stone-300 pb-1 mb-3">Estaciones showcooking · Materia prima</h4>
        <table class="w-full text-sm mb-6">
          <thead class="text-xs uppercase text-stone-600">
            <tr><th class="text-left py-1 pr-2">Estación</th><th class="text-right py-1 px-2">Cantidad total</th><th class="text-left py-1 pl-2">Unidad</th></tr>
          </thead>
          <tbody>`;
      r.estaciones.forEach(e => {
        html += `
            <tr class="border-b border-stone-100">
              <td class="py-1 pr-2">${Utils.esc(e.name)}</td>
              <td class="py-1 px-2 text-right font-medium">${e.cantidad}</td>
              <td class="py-1 pl-2 text-xs">${Utils.esc(e.unidad)} (incluye merma 10%)</td>
            </tr>`;
      });
      html += `</tbody></table>`;
    }

    html += `
        <div class="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 mt-6">
          <strong>Pendiente:</strong> agrupación por proveedor concreto (Discarlux / Garcimar / Prodesco / etc.) requiere catálogo proveedor por canapé. Por ahora la orden agrupa por categoría operativa.
        </div>

        <div class="text-xs text-stone-400 text-center mt-8 pt-4 border-t border-stone-200">
          Documento generado por App Eventos · Casa Amparo 1948 · ${new Date().toLocaleDateString("es-ES")}
        </div>
      </div>
    `;
    return html;
  },
};

window.GenOrdenCompra = GenOrdenCompra;
