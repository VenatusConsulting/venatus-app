import { getMines, getMinesStats, addMine, updateMine, deleteMine } from "./api-module.js";

const STATUTS_MINE = {
  a_faire:  { label: "🔵 À faire",  color: "#667eea" },
  en_cours: { label: "🟡 En cours", color: "#f59e0b" },
  epuise:   { label: "⚫ Épuisé",   color: "#666"    },
};

const NICHES = {
  influenceuse: "💋 Influenceuse",
  fitness:      "💪 Fitness",
  gaming:       "🎮 Gaming",
  cosplay:      "🎨 Cosplay",
};

const NICHE_COLORS = {
  influenceuse: "#ec4899",
  fitness:      "#10b981",
  gaming:       "#667eea",
  cosplay:      "#f59e0b",
};

const SOURCES = {
  dork:         "🔍 Dorking",
  abonnements:  "👥 Abonnements",
  reels:        "🎬 Reels",
  tiktok:       "🎵 TikTok",
  manuel:       "✋ Manuel",
};

function extractPseudo(val) {
  if (!val) return "";
  val = val.trim();
  // Si c'est une URL instagram — extrait juste le pseudo
  if (val.includes("instagram.com/")) {
    const match = val.match(/instagram\.com\/([^/?#\s]+)/);
    if (match) return "@" + match[1].replace(/\/$/, "");
  }
  // Si ça commence par @ on garde
  if (val.startsWith("@")) return val;
  // Sinon on ajoute @
  return "@" + val;
}

function getInstagramUrl(compte) {
  const pseudo = compte.replace("@", "");
  return `https://www.instagram.com/${pseudo}/`;
}

async function loadStats() {
  const s = await getMinesStats();
  document.getElementById("mines-kpis").innerHTML = [
    { icon: "⛏️", label: "Total mines",        val: s.total,               color: "" },
    { icon: "🔵", label: "À faire",             val: s.a_faire,             color: "#667eea" },
    { icon: "🟡", label: "En cours",            val: s.en_cours,            color: "#f59e0b" },
    { icon: "⚫", label: "Épuisées",            val: s.epuise,              color: "#666" },
    { icon: "👤", label: "Leads trouvés total", val: s.total_leads_trouves, color: "var(--green)" },
    { icon: "🏆", label: "Meilleure mine",
      val: s.best_mine ? `${s.best_mine.compte} (${s.best_mine.nb_leads})` : "—",
      color: "var(--yellow)" },
  ].map(k => `
    <div class="kpi-card">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-value" style="${k.color ? `color:${k.color}` : ""}">${k.val}</div>
      <div class="kpi-label">${k.label}</div>
    </div>
  `).join("");
}

async function loadMines() {
  const statut = document.getElementById("filter-statut").value;
  const niche  = document.getElementById("filter-niche").value;
  let data     = await getMines(statut === "tous" ? "" : statut);
  if (niche) data = data.filter(m => m.niche === niche);

  const el = document.getElementById("mines-list");
  if (!data.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text3);">
        <div style="font-size:40px;margin-bottom:12px;">⛏️</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px;">Aucune mine</div>
        <div style="font-size:13px;">Ajoute des comptes Instagram à explorer pour trouver des leads</div>
      </div>
    `;
    return;
  }

  // Grouper par statut
  const ordre   = ["en_cours", "a_faire", "epuise"];
  const groupes = { a_faire: [], en_cours: [], epuise: [] };
  data.forEach(m => { if (groupes[m.statut]) groupes[m.statut].push(m); });

  el.innerHTML = ordre.map(statut => {
    const items = groupes[statut];
    if (!items.length) return "";
    const s = STATUTS_MINE[statut];
    return `
      <div class="section-title" style="color:${s.color};">
        ${s.label}
        <span class="section-count" style="color:${s.color};">${items.length}</span>
      </div>
      ${items.map(mine => renderMine(mine)).join("")}
    `;
  }).join("");
}

function renderMine(mine) {
  const s   = STATUTS_MINE[mine.statut] || STATUTS_MINE.a_faire;
  const url = getInstagramUrl(mine.compte);

  return `
    <div class="mine-card" id="mine-${mine._id}">
      <div class="mine-card-header">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <a href="${url}" target="_blank" class="mine-compte">${mine.compte}</a>
            <span style="font-size:11px;color:${s.color};background:${s.color}18;border:1px solid ${s.color}44;padding:2px 8px;border-radius:10px;font-weight:600;">
              ${s.label}
            </span>
          </div>
          <div class="mine-tags">
            ${mine.niche  ? `<span class="mine-tag" style="color:${NICHE_COLORS[mine.niche]};border-color:${NICHE_COLORS[mine.niche]}44;">${NICHES[mine.niche]}</span>` : ""}
            ${mine.source ? `<span class="mine-tag">${SOURCES[mine.source] || mine.source}</span>` : ""}
            <span class="mine-tag" style="color:var(--text3);">📅 ${mine.date_ajout?.split(" ")[0] || "?"}</span>
          </div>
        </div>
        <div class="mine-actions">
          <button onclick="window._deleteMine('${mine._id}', '${mine.compte.replace(/'/g, "\\'")}')"
            style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:6px 10px;color:#ef5350;font-size:13px;cursor:pointer;">
            🗑️
          </button>
        </div>
      </div>

      <!-- Statuts rapides -->
      <div class="mine-statut-pills">
        ${Object.entries(STATUTS_MINE).map(([key, val]) => `
          <button class="mine-pill" data-mine="${mine._id}" data-statut="${key}"
            style="color:${val.color};border-color:${mine.statut === key ? val.color : 'var(--border2)'};background:${mine.statut === key ? val.color + '18' : 'transparent'};">
            ${val.label}
          </button>
        `).join("")}
      </div>

      <!-- Compteur leads -->
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div class="mine-leads-counter">
          <button onclick="window._decLead('${mine._id}', ${mine.nb_leads})">−</button>
          <span class="mine-leads-num">${mine.nb_leads || 0}</span>
          <button onclick="window._incLead('${mine._id}', ${mine.nb_leads})">+</button>
          <span style="font-size:11px;color:var(--text3);margin-left:4px;">leads piochés</span>
        </div>
        ${mine.nb_leads > 0 ? `
          <div style="font-size:12px;color:var(--green);">
            ✅ ${mine.nb_leads} lead${mine.nb_leads > 1 ? "s" : ""} trouvé${mine.nb_leads > 1 ? "s" : ""}
          </div>
        ` : ""}
      </div>

      ${mine.notes ? `<div class="mine-notes">📝 ${mine.notes}</div>` : ""}
    </div>
  `;
}

// ── Actions ──────────────────────────────────────────────────────────────────

window._deleteMine = async (id, compte) => {
  if (!confirm(`Supprimer la mine ${compte} ?`)) return;
  await deleteMine(id);
  loadStats();
  loadMines();
};

window._incLead = async (id, current) => {
  await updateMine(id, { nb_leads: (current || 0) + 1 });
  loadStats();
  loadMines();
};

window._decLead = async (id, current) => {
  if ((current || 0) <= 0) return;
  await updateMine(id, { nb_leads: (current || 0) - 1 });
  loadStats();
  loadMines();
};

// ── Init ─────────────────────────────────────────────────────────────────────

window.initMines = function() {
  loadStats();
  loadMines();

  document.getElementById("filter-statut").addEventListener("change", loadMines);
  document.getElementById("filter-niche").addEventListener("change",  loadMines);

  // Délégation pour les pills de statut
  document.getElementById("mines-list").addEventListener("click", async (e) => {
    const btn = e.target.closest(".mine-pill");
    if (!btn) return;
    const id     = btn.dataset.mine;
    const statut = btn.dataset.statut;
    await updateMine(id, { statut });
    loadStats();
    loadMines();
  });

  // Popup ajout
  document.getElementById("btn-add-mine").addEventListener("click", () => {
    document.getElementById("add-popup").classList.remove("hidden");
    document.getElementById("new-compte").focus();
  });

  document.getElementById("btn-cancel-add").addEventListener("click", () => {
    document.getElementById("add-popup").classList.add("hidden");
  });

  document.getElementById("add-popup").addEventListener("click", (e) => {
    if (e.target === document.getElementById("add-popup"))
      document.getElementById("add-popup").classList.add("hidden");
  });

  document.getElementById("btn-confirm-add").addEventListener("click", async () => {
    const raw    = document.getElementById("new-compte").value.trim();
    const compte = extractPseudo(raw);
    if (!compte || compte === "@") {
      document.getElementById("new-compte").style.borderColor = "#ef5350";
      return;
    }

    const btn = document.getElementById("btn-confirm-add");
    btn.textContent = "...";
    btn.disabled    = true;

    try {
      await addMine({
        compte,
        niche:  document.getElementById("new-niche").value,
        source: document.getElementById("new-source").value,
        notes:  document.getElementById("new-notes").value.trim(),
      });
      document.getElementById("add-popup").classList.add("hidden");
      document.getElementById("new-compte").value = "";
      document.getElementById("new-niche").value  = "";
      document.getElementById("new-source").value = "";
      document.getElementById("new-notes").value  = "";
      loadStats();
      loadMines();
    } catch(e) {
      btn.textContent   = "⚠️ Déjà existante";
      btn.style.background = "#ef535033";
      setTimeout(() => {
        btn.textContent      = "⛏️ Ajouter la mine";
        btn.style.background = "";
        btn.disabled         = false;
      }, 2000);
      return;
    }

    btn.textContent = "⛏️ Ajouter la mine";
    btn.disabled    = false;
  });
};
