/* csv-parser.js — parser CSV mínimo, soporta separador ; o , y campos entre comillas */

const CSVParser = {
  /**
   * Parsea CSV string a array de objects.
   * Detecta automáticamente separador (; o ,).
   * Primera fila = headers.
   * Devuelve [{header1: val, header2: val, ...}, ...]
   */
  parse(text) {
    if (!text || typeof text !== "string") return [];

    // Detectar separador en primera línea
    const firstLine = text.split(/\r?\n/)[0];
    const sep = firstLine.includes(";") ? ";" : ",";

    const rows = this._parseLines(text, sep);
    if (rows.length === 0) return [];

    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? row[i] : "";
      });
      return obj;
    });
  },

  /** Parsea CSV en filas/celdas, manejando comillas y saltos de línea dentro de campos */
  _parseLines(text, sep) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (c === '"' && next === '"') { cell += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { cell += c; }
      } else {
        if (c === '"') { inQuotes = true; }
        else if (c === sep) { row.push(cell); cell = ""; }
        else if (c === "\n" || c === "\r") {
          if (c === "\r" && next === "\n") i++;
          row.push(cell);
          if (row.length > 1 || row[0] !== "") rows.push(row);
          row = [];
          cell = "";
        }
        else { cell += c; }
      }
    }
    // última fila si no termina en \n
    if (cell !== "" || row.length > 0) {
      row.push(cell);
      if (row.length > 1 || row[0] !== "") rows.push(row);
    }
    return rows;
  },
};

window.CSVParser = CSVParser;
