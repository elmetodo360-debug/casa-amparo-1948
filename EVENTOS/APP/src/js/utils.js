/* utils.js — helpers comunes */

const Utils = {
  /** Formatea número como €X,XX (estilo España) */
  fmtEur(n, decimals = 2) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  },

  /** Convierte string europeo "0,45" → 0.45. Si no es número, devuelve el string. */
  parseEuroNumber(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return v;
    const s = String(v).trim();
    if (s === "") return null;
    // Intenta integer puro
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    // Float con coma o punto
    const normalized = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return isNaN(n) ? v : n;
  },

  /** Crea un elemento HTML con clase y contenido */
  el(tag, className = "", html = "") {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html) e.innerHTML = html;
    return e;
  },

  /** Escape HTML */
  esc(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  /** Loguea con prefijo de la app */
  log(...args) {
    console.log("[App Eventos]", ...args);
  },

  /** Loguea error con prefijo */
  err(...args) {
    console.error("[App Eventos]", ...args);
  },
};

window.Utils = Utils;
