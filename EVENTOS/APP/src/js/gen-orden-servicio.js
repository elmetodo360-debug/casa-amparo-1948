/* gen-orden-servicio.js — Sprint 7: Orden de Servicio (cronograma + asignación) */

const GenOrdenServicio = {
  data: null,

  init(appData) { this.data = appData; },

  generate(evento) {
    const personal = CalcPersonal.calculate(evento);
    const horaInicio = "20:00"; // default; en futuro: campo del evento
    const cronograma = this._buildCronograma(evento, horaInicio);
    return { evento, personal, cronograma, horaInicio };
  },

  _buildCronograma(evento, horaInicio) {
    const dur = evento.duracion_min || 75;
    const [h, m] = horaInicio.split(":").map(Number);
    const startMin = h * 60 + m;

    const eventos = [
      { offset: -180, label: "Arranque montaje (mise en place cocina + sala)" },
      { offset: -90,  label: "Montaje barra + cristalería + decoración" },
      { offset: -45,  label: "Briefing equipo + reparto de zonas" },
      { offset: -15,  label: "Equipo en posición · welcome drink listo" },
      { offset: 0,    label: "INICIO SERVICIO · llegada de invitados" },
      { offset: 15,   label: "Pase activo de canapés fríos" },
      { offset: 30,   label: "Inicio pase canapés calientes" },
    ];
    if (evento.estaciones && evento.estaciones.length > 0) {
      eventos.push({ offset: 20, label: `Apertura estaciones showcooking: ${evento.estaciones.join(" · ")}` });
    }
    eventos.push({ offset: dur - 15, label: "Aviso 15' al cierre" });
    eventos.push({ offset: dur, label: "FIN SERVICIO" });
    eventos.push({ offset: dur + 15, label: "Inicio desmontaje" });
    eventos.push({ offset: dur + 75, label: "Cierre operativo · evento terminado" });

    return eventos.sort((a, b) => a.offset - b.offset).map(e => ({
      hora: this._fmtMin(startMin + e.offset),
      label: e.label,
    }));
  },

  _fmtMin(totalMin) {
    let m = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  },

  render(evento) {
    const r = this.generate(evento);
    let html = `
      <div class="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <h3 class="font-semibold text-stone-700">Orden de Servicio</h3>
        <button onclick="window.print()" class="text-xs px-3 py-1 border border-stone-300 rounded hover:bg-stone-100 print:hidden">Imprimir / Guardar PDF</button>
      </div>

      <div class="printable bg-white border border-stone-200 rounded p-6">
        <div class="text-center mb-6 print:mb-4">
          <div class="text-xs uppercase tracking-wider text-stone-500">Casa Amparo 1948</div>
          <div class="text-2xl font-bold text-[#870120]">Orden de Servicio</div>
          <div class="text-sm text-stone-600 mt-1">${Utils.esc(evento.nombre)} · ${Utils.esc(evento.fecha)}</div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-6">
          <div><span class="text-xs text-stone-500 block">Cliente</span>${Utils.esc(evento.cliente || "—")}</div>
          <div><span class="text-xs text-stone-500 block">Comensales</span>${evento.pax} pax</div>
          <div><span class="text-xs text-stone-500 block">Tipo</span>${Utils.esc(evento.tipo_evento)} ${Utils.esc(evento.pack_coctel || "")}</div>
          <div><span class="text-xs text-stone-500 block">Duración servicio</span>${evento.duracion_min} min</div>
          <div><span class="text-xs text-stone-500 block">Espacio</span>${Utils.esc(evento.espacio || "—")}</div>
          <div><span class="text-xs text-stone-500 block">Tipo barra</span>${Utils.esc(evento.tipo_barra || "—")}</div>
          <div><span class="text-xs text-stone-500 block">Nivel servicio</span>${Utils.esc(evento.nivel_servicio || "—")}</div>
          <div><span class="text-xs text-stone-500 block">Tipo cliente</span>${Utils.esc(evento.tipo_cliente || "—")}</div>
        </div>

        <h4 class="font-semibold text-sm uppercase tracking-wider text-stone-600 border-b border-stone-300 pb-1 mb-3">Cronograma</h4>
        <table class="w-full text-sm mb-6">
          <tbody>`;
    r.cronograma.forEach(c => {
      html += `
            <tr class="border-b border-stone-100">
              <td class="py-1 pr-4 font-mono text-stone-700">${c.hora}</td>
              <td class="py-1">${Utils.esc(c.label)}</td>
            </tr>`;
    });
    html += `
          </tbody>
        </table>

        <h4 class="font-semibold text-sm uppercase tracking-wider text-stone-600 border-b border-stone-300 pb-1 mb-3">Equipo asignado (${r.personal.personasTotal} personas · ${r.personal.horasFact}h facturadas)</h4>
        <table class="w-full text-sm mb-6">
          <thead class="text-xs uppercase text-stone-600">
            <tr><th class="text-left py-1 pr-2">Puesto</th><th class="text-right py-1 px-2">Personas</th><th class="text-left py-1 px-2">Tier</th><th class="text-right py-1 pl-2">€/h</th></tr>
          </thead>
          <tbody>`;
    r.personal.lines.forEach(l => {
      html += `
            <tr class="border-b border-stone-100">
              <td class="py-1 pr-2">${Utils.esc(l.puesto)}</td>
              <td class="py-1 px-2 text-right">${l.personas}</td>
              <td class="py-1 px-2 text-xs">${Utils.esc(l.tier)}</td>
              <td class="py-1 pl-2 text-right">${Utils.fmtEur(l.eur_h)}</td>
            </tr>`;
    });
    html += `
          </tbody>
        </table>`;

    if (evento.notas) {
      html += `
        <h4 class="font-semibold text-sm uppercase tracking-wider text-stone-600 border-b border-stone-300 pb-1 mb-3">Notas internas</h4>
        <p class="text-sm whitespace-pre-wrap mb-6">${Utils.esc(evento.notas)}</p>`;
    }

    html += `
        <div class="text-xs text-stone-400 text-center mt-8 pt-4 border-t border-stone-200">
          Documento generado por App Eventos · Casa Amparo 1948 · ${new Date().toLocaleDateString("es-ES")}
        </div>
      </div>
    `;
    return html;
  },
};

window.GenOrdenServicio = GenOrdenServicio;
