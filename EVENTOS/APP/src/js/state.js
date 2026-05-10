/* state.js — gestión simple de estado vía localStorage */

const State = {
  KEY: "appEventos.v0.1",

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      Utils.err("State.load fallo:", e);
      return {};
    }
  },

  save(obj) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(obj));
    } catch (e) {
      Utils.err("State.save fallo:", e);
    }
  },

  get(key, fallback = null) {
    const s = this.load();
    return s[key] !== undefined ? s[key] : fallback;
  },

  set(key, value) {
    const s = this.load();
    s[key] = value;
    this.save(s);
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },
};

window.State = State;
