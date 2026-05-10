/* data-loader.js — carga las 8 pestañas del Sheet (publicadas como CSV) */

const DataLoader = {
  CONFIG_URL: "data/sheet-config.json",
  CACHE_KEY: "appEventos.dataCache.v1",
  CACHE_TTL_MIN: 5,

  /** Carga todos los datos. Devuelve {tabName: [rows], ...} */
  async loadAll() {
    const config = await this._loadConfig();
    const tabs = config.tabs || {};
    const result = {};

    // Carga en paralelo
    const promises = Object.entries(tabs).map(async ([tabName, url]) => {
      if (!url || url.trim() === "" || url.includes("PEGAR_URL_AQUI")) {
        result[tabName] = { error: "URL no configurada en sheet-config.json" };
        return;
      }
      try {
        const csv = await this._fetchCSV(url);
        const rows = CSVParser.parse(csv);
        // Convierte números europeos en columnas numéricas conocidas
        const normalized = rows.map(r => {
          const out = {};
          for (const k in r) {
            out[k] = Utils.parseEuroNumber(r[k]);
          }
          return out;
        });
        result[tabName] = { rows: normalized, count: normalized.length };
      } catch (e) {
        result[tabName] = { error: e.message || String(e) };
      }
    });

    await Promise.all(promises);
    return result;
  },

  async _loadConfig() {
    const res = await fetch(this.CONFIG_URL);
    if (!res.ok) throw new Error(`No se pudo cargar ${this.CONFIG_URL} (HTTP ${res.status})`);
    return res.json();
  },

  async _fetchCSV(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`);
    return res.text();
  },
};

window.DataLoader = DataLoader;
