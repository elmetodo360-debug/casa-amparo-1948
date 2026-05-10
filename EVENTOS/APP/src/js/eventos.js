/* eventos.js — vista de eventos guardados */

const Eventos = {
  init() {
    this.refresh();
  },

  refresh() {
    const list = document.getElementById("eventos-list");
    if (!list) return;
    const eventos = State.get("eventos", []);
    if (eventos.length === 0) {
      list.innerHTML = `<p class="text-sm text-stone-500 italic">Aún no hay eventos guardados. Crea uno desde "Nuevo evento".</p>`;
      return;
    }
    // Ordena por fecha descendente
    const sorted = [...eventos].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    let html = `
      <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-stone-100 text-xs uppercase">
          <tr>
            <th class="text-left px-2 py-2">Nombre</th>
            <th class="text-left px-2 py-2">Cliente</th>
            <th class="text-left px-2 py-2">Fecha</th>
            <th class="text-left px-2 py-2">Tipo</th>
            <th class="text-right px-2 py-2">Pax</th>
            <th class="text-left px-2 py-2">Pack</th>
            <th class="text-left px-2 py-2">Signatures</th>
            <th class="text-left px-2 py-2">Estaciones</th>
            <th class="text-right px-2 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>`;
    sorted.forEach(ev => {
      html += `
        <tr class="border-t border-stone-200 hover:bg-stone-50">
          <td class="px-2 py-2">${Utils.esc(ev.nombre || "—")}</td>
          <td class="px-2 py-2">${Utils.esc(ev.cliente || "—")}</td>
          <td class="px-2 py-2">${Utils.esc(ev.fecha || "—")}</td>
          <td class="px-2 py-2">${Utils.esc(ev.tipo_evento || "—")}</td>
          <td class="px-2 py-2 text-right">${ev.pax || "—"}</td>
          <td class="px-2 py-2">${Utils.esc(ev.pack_coctel || ev.pack_menu_sentado || ev.pack_coffee || (ev.tipo_evento === "brasas" || ev.tipo_evento === "arroces" ? "único" : "—"))}</td>
          <td class="px-2 py-2">${(ev.signatures || []).length}</td>
          <td class="px-2 py-2">${(ev.estaciones || []).length}</td>
          <td class="px-2 py-2 text-right">
            <a href="#calculo/${Utils.esc(ev.id)}" class="text-[#870120] font-medium hover:underline text-xs mr-3">Calcular</a>
            <button data-id="${ev.id}" class="btn-view text-blue-600 hover:underline text-xs mr-2">Ver</button>
            <button data-id="${ev.id}" class="btn-del text-red-600 hover:underline text-xs">Borrar</button>
          </td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    list.innerHTML = html;

    list.querySelectorAll(".btn-del").forEach(b => b.addEventListener("click", e => {
      const id = e.target.dataset.id;
      if (confirm("¿Borrar este evento? Esta acción no se puede deshacer.")) {
        const eventos = State.get("eventos", []).filter(x => x.id !== id);
        State.set("eventos", eventos);
        this.refresh();
      }
    }));

    list.querySelectorAll(".btn-view").forEach(b => b.addEventListener("click", e => {
      const id = e.target.dataset.id;
      const ev = State.get("eventos", []).find(x => x.id === id);
      if (ev) {
        alert("Evento:\n\n" + JSON.stringify(ev, null, 2));
      }
    }));
  },
};

window.Eventos = Eventos;
