/* ===== Casa Amparo 1948 — Recetario ===== */

const PASSWORD = "CasaAmparo1948";
const STORAGE_KEY = "cca1948_auth";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- Login ---------- */
function checkAuth() {
  if (sessionStorage.getItem(STORAGE_KEY) === "ok" ||
      localStorage.getItem(STORAGE_KEY) === "ok") {
    showApp();
    loadData();
  } else {
    $("#login").classList.remove("hidden");
    $("#password").focus();
  }
}

function attemptLogin() {
  const val = $("#password").value;
  if (val === PASSWORD) {
    localStorage.setItem(STORAGE_KEY, "ok");
    showApp();
    loadData();
  } else {
    $("#login-err").textContent = "Contraseña incorrecta";
    $("#password").value = "";
    $("#password").focus();
  }
}

function showApp() {
  $("#login").classList.add("hidden");
  $("#app").classList.remove("hidden");
}

function logout() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  location.reload();
}

$("#login-btn").addEventListener("click", attemptLogin);
$("#password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") attemptLogin();
});
$("#logout").addEventListener("click", logout);

/* ---------- Datos ---------- */
let RECETAS = [];
let activeCarta = "todas";
let query = "";

async function loadData() {
  try {
    const res = await fetch("data/recetas.json?v=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    RECETAS = data.recetas || [];
    buildFilters();
    render();
  } catch (e) {
    $("#grid").innerHTML =
      '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#c0392b">' +
      "No se pudieron cargar las recetas.<br><small>" + e.message + "</small></p>";
  }
}

/* ---------- Normalización para búsqueda ---------- */
function norm(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function recipeMatchesQuery(r, q) {
  if (!q) return true;
  const haystack = [
    r.nombre,
    r.nombre_carta,
    r.seccion,
    r.descripcion,
    ...(r.ingredientes || []).map((i) => i.nombre),
    ...(r.subrecetas || []).map((s) => s.nombre),
  ].map(norm).join(" | ");
  return q.split(/\s+/).every((w) => haystack.includes(w));
}

/* ---------- Filtros ---------- */
function buildFilters() {
  const cont = $("#filters");
  cont.innerHTML = "";

  const cartas = [
    { id: "todas", label: "Todas" },
    { id: "principal", label: "Carta" },
    { id: "entrehoras", label: "Entrehoras" },
    { id: "menu", label: "Menú" },
    { id: "infantil", label: "Menú infantil" },
  ];

  for (const c of cartas) {
    const b = document.createElement("button");
    b.className = "chip" + (c.id === activeCarta ? " active" : "");
    b.textContent = c.label;
    b.addEventListener("click", () => {
      activeCarta = c.id;
      buildFilters();
      render();
    });
    cont.appendChild(b);
  }
}

/* ---------- Render lista ---------- */
function render() {
  const q = norm(query.trim());
  const filtered = RECETAS.filter((r) => {
    if (activeCarta !== "todas" && !(r.cartas || []).includes(activeCarta)) return false;
    if (!recipeMatchesQuery(r, q)) return false;
    return true;
  });

  $("#count").textContent = filtered.length;
  $("#empty").classList.toggle("hidden", filtered.length > 0);

  const grid = $("#grid");
  grid.innerHTML = "";
  for (const r of filtered) grid.appendChild(cardEl(r));
}

function cardEl(r) {
  const a = document.createElement("button");
  a.className = "card";

  const wrap = document.createElement("div");
  wrap.className = "card-img-wrap" + (r.foto ? "" : " no-photo");
  if (r.foto) {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = r.foto;
    img.alt = r.nombre;
    img.onerror = () => { wrap.classList.add("no-photo"); img.remove(); };
    wrap.appendChild(img);
  }
  if ((r.cartas || []).length) {
    const bd = document.createElement("div");
    bd.className = "badges";
    bd.innerHTML = (r.cartas || [])
      .map((c) => {
        const lbl = cartaLabel(c);
        return `<span class="badge">${lbl}</span>`;
      })
      .join("");
    wrap.appendChild(bd);
  }

  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = `<div class="card-title">${escapeHtml(r.nombre_carta || r.nombre)}</div>`;

  a.appendChild(wrap);
  a.appendChild(body);
  a.addEventListener("click", () => openDetail(r));
  return a;
}

/* ---------- Detalle ---------- */
function openDetail(r) {
  const cont = $("#detail-content");

  const heroPhoto = r.foto
    ? `<div class="detail-hero" id="hero"><img src="${escapeAttr(r.foto)}" alt="${escapeAttr(r.nombre)}"/></div>`
    : `<div class="detail-hero no-photo">Sin foto</div>`;

  const cartasTags = (r.cartas || [])
    .map((c) => {
      const lbl = cartaLabel(c);
      return `<span class="meta-tag">${lbl}</span>`;
    })
    .join("");

  const alergenos = (r.alergenos || [])
    .map((a) => `<span class="meta-tag allergen">${escapeHtml(a)}</span>`)
    .join("");

  const ingredientesHtml = (r.ingredientes || [])
    .map((i) => {
      const med = i.med != null ? formatMed(i.med) + " " + escapeHtml(i.udm || "") : "";
      const notas = i.notas ? `<span class="ing-notas">${escapeHtml(i.notas)}</span>` : "";
      return `<li><span class="ing-name">${escapeHtml(i.nombre)}${notas}</span><span class="ing-med">${med}</span></li>`;
    })
    .join("");

  const elab = r.elaboracion || {};
  const elabBlocks = [];
  if (elab.pre)
    elabBlocks.push(detailsBlock("Pre-elaboración", "PRE", elab.pre, true));
  if (elab.elaboracion)
    elabBlocks.push(detailsBlock("Elaboración", "ELAB", elab.elaboracion, true));
  if (elab.emplatado)
    elabBlocks.push(detailsBlock("Emplatado", "MONTAJE", elab.emplatado, true));
  if (elabBlocks.length === 0 && elab.raw)
    elabBlocks.push(detailsBlock("Elaboración", "", elab.raw, true));

  const pcgHtml = (r.pcg || []).length
    ? `<h2 class="block-h">Puntos críticos</h2>
       <ul class="pcg">${r.pcg.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>`
    : "";

  const subrecetasHtml = (r.subrecetas || []).length
    ? `<h2 class="block-h">Subrecetas</h2>` +
      r.subrecetas
        .map((s) => {
          const ings = (s.ingredientes || [])
            .map((i) => `<li><span>${escapeHtml(i.nombre)}</span><span class="med">${formatMed(i.med)} ${escapeHtml(i.udm || "")}</span></li>`)
            .join("");
          const codigo = s.codigo ? `<span class="subreceta-codigo">${escapeHtml(s.codigo)}</span>` : "";
          const elabSub = s.elaboracion ? `<div class="subreceta-elab">${escapeHtml(s.elaboracion)}</div>` : "";
          return `<div class="subreceta">
            <div class="subreceta-head">${escapeHtml(s.nombre)}${codigo}</div>
            <ul class="subreceta-ing">${ings}</ul>
            ${elabSub}
          </div>`;
        })
        .join("")
    : "";

  cont.innerHTML = `
    ${heroPhoto}
    <div class="detail-body">
      <h1 class="detail-title">${escapeHtml(r.nombre_carta || r.nombre)}</h1>
      ${r.descripcion ? `<p class="detail-desc">${escapeHtml(r.descripcion)}</p>` : ""}
      <div class="detail-meta">
        ${cartasTags}
        ${alergenos}
      </div>
      <h2 class="block-h">Ingredientes</h2>
      <ul class="ingredientes">${ingredientesHtml || '<li><em style="color:var(--muted)">Sin ingredientes registrados</em></li>'}</ul>
      <h2 class="block-h">Elaboración</h2>
      ${elabBlocks.join("") || '<p style="color:var(--muted);font-style:italic">Sin elaboración registrada</p>'}
      ${pcgHtml}
      ${subrecetasHtml}
    </div>
  `;

  // Lightbox
  const hero = $("#hero");
  if (hero) {
    hero.addEventListener("click", () => {
      const img = hero.querySelector("img");
      if (!img) return;
      $("#lightbox-img").src = img.src;
      $("#lightbox").classList.remove("hidden");
    });
  }

  $("#detail").classList.remove("hidden");
  $("#detail").scrollTop = 0;
  history.pushState({ detail: r.id }, "", "#" + r.id);
}

function closeDetail() {
  $("#detail").classList.add("hidden");
  if (location.hash) history.replaceState(null, "", location.pathname);
}

$("#back").addEventListener("click", closeDetail);
window.addEventListener("popstate", () => {
  if (!$("#detail").classList.contains("hidden")) closeDetail();
});

$("#lightbox").addEventListener("click", () => {
  $("#lightbox").classList.add("hidden");
  $("#lightbox-img").src = "";
});

/* ---------- Helpers ---------- */
function cartaLabel(c) {
  if (c === "principal") return "Carta";
  if (c === "entrehoras") return "Entrehoras";
  if (c === "infantil") return "Menú infantil";
  return "Menú";
}

function detailsBlock(title, tag, body, openByDefault) {
  const tagHtml = tag ? `<span class="elab-tag">${tag}</span>` : "";
  const formatted = formatBody(body);
  return `<details class="elab-block"${openByDefault ? " open" : ""}>
    <summary>${tagHtml}${escapeHtml(title)}</summary>
    <div class="elab-body">${formatted}</div>
  </details>`;
}

function formatBody(text) {
  // Si tiene líneas numeradas (1. 2. 3.) las convierto en lista ordenada
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every((l) => /^\d+[\.\)]/.test(l))) {
    return "<ol>" + lines.map((l) => "<li>" + escapeHtml(l.replace(/^\d+[\.\)]\s*/, "")) + "</li>").join("") + "</ol>";
  }
  return lines.map((l) => "<p>" + escapeHtml(l) + "</p>").join("");
}

function formatMed(v) {
  if (v == null) return "";
  if (typeof v === "number") {
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(2).replace(/\.?0+$/, "");
  }
  return String(v);
}

function escapeHtml(s) {
  return (s == null ? "" : String(s))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s) { return escapeHtml(s); }

/* ---------- Buscador ---------- */
$("#search").addEventListener("input", (e) => {
  query = e.target.value;
  render();
});

/* ---------- Init ---------- */
checkAuth();
