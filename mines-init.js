import { getMines, getMinesStats, addMine, updateMine, deleteMine } from "./api-module.js";

const STATUTS_MINE = {
  a_faire:  { label: "🔵 À faire",  color: "#667eea" },
  en_cours: { label: "🟡 En cours", color: "#f59e0b" },
  epuise:   { label: "⚫ Épuisé",   color: "#555"    },
};

const NICHES = {
  influenceuse: "💋 Influenceuse",
  fitness:      "💪 Fitness",
  gaming:       "🎮 Gaming",
  cosplay:      "🎨 Cosplay",
};

const SOURCES = {
  dork:         "🔍 Google Dorking",
  abonnements:  "👥 Abonnements",
  reels:        "🎬 Reels Instagram",
  tiktok:       "🎵 TikTok",
  manuel:       "✋ Manuel",
};

let currentMineId = null;

async function loadStats() {
  const s = await getMinesStats();
  document.getElementById("mines-kpis").innerHTML = [
    { icon: "⛏️", label: "Total mines",         val: s.total,               color: "" },
    { icon: "🔵", label: "À faire",              val: s.a_faire,             color: "#667eea" },
    { icon: "🟡", label: "En cours",             val: s.en_cours,            color: "#f59e0b" },
    { icon: "⚫", label: "Épuisées",             val: s.epuise,              color: "#555" },
    { icon: "👤", label: "Leads trouvés total",  val: s.total_leads_trouves, color: "var(--green)" },
    { icon: "🏆", label: "Meilleure mine",        val: s.best_mine ? `${s.best_mine.compte} (${s.best_mine.nb_leads} leads)` : "—", color: "var(--yellow)" },
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
    el.innerHTML = '<div class="empty">Aucune mine — ajoute des comptes IG à explorer !</div>';
    return;
  }

  // Grouper par statut
  const groupes = { a_faire: [], en_cours: [], epuise: [] };
  data.forEach(m => { if (groupes[m.statut]) groupes[m.statut].push(m); });

  el.innerHTML = Object.entries(groupes).map(([statut, items]) => {
    if (!items.length) return "";
    const s = STATUTS_MINE[statut];
    return `
      <div style="margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:${s.color};margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">
          ${s.label} — ${items.length}
        </div>
        ${items.map(mine => renderMine(mine)).join("")}
      </div>
    `;
  }).join("");
}

function renderMine(mine) {
  const s = STATUTS_MINE[mine.statut] || STATUTS_MINE.a_faire;
  return `
    <div class="lead-row" style="cursor:default;">
      <div class="lead-main">
        <div class="lead-pseudo" style="display:flex;align-items:center;gap:8px;">
          <a href="https://instagram.com/${mine.compte.replace('@','')}" target="_blank"
            style="color:var(--text);text-decoration:none;font-weight:700;">
            ${mine.compte}
          </a>
          <span style="font-size:11px;color:${s.color};background:${s.color}22;padding:2px 8px;border-radius:10px;">${s.label}</span>
        </div>
        <div class="lead-meta">
          ${mine.niche  ? `<span class="tag">${NICHES[mine.niche] || mine.niche}</span>` : ""}
          ${mine.source ? `<span class="tag">${SOURCES[mine.source] || mine.source}</span>` : ""}
          ${mine.nb_leads > 0 ? `<span class="tag" style="color:var(--green)">👤 ${mine.nb_leads} leads trouvés</span>` : ""}
          ${mine.notes  ? `<span class="tag" style="color:var(--text3)">📝 ${mine.notes.slice(0, 40)}${mine.notes.length > 40 ? "..." : ""}</span>` : ""}
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
        <button onclick="window._editMine('${mine._id}')"
          style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:5px 10px;color:var(--text2);font-size:12px;cursor:pointer;">
          ✏️
        </button>
        <button onclick="window._deleteMine('${mine._id}', '${mine.compte.replace(/'/g, "\\'")}')"
          style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:5px 10px;color:#ef5350;font-size:12px;cursor:pointer;">
          🗑️
        </button>
      </div>
    </div>
  `;
}

async function openEditModal(id) {
  currentMineId = id;
  const all  = await getMines();
  const mine = all.find(m => m._id === id);
  if (!mine) return;

  document.getElementById("edit-modal-title").textContent = `✏️ ${mine.compte}`;
  document.getElementById("edit-modal-body").innerHTML = `
    <div>
      <label class="detail-label">Statut</label>
      <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
        ${Object.entries(STATUTS_MINE).map(([key, val]) => `
          <button data-statut="${key}" class="mine-statut-btn" style="
            background:${mine.statut === key ? val.color + '22' : 'var(--bg3)'};
            border:1px solid ${mine.statut === key ? val.color : 'var(--border2)'};
            border-radius:8px;padding:6px 14px;color:${mine.statut === key ? val.color : 'var(--text2)'};
            font-size:13px;cursor:pointer;font-weight:${mine.statut === key ? '700' : '400'};
          ">${val.label}</button>
        `).join("")}
      </div>
    </div>
    <div>
      <label class="detail-label">Leads trouvés dans cette mine</label>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
        <input type="number" id="edit-nb-leads" value="${mine.nb_leads || 0}" min="0"
          style="width:80px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:6px 10px;color:var(--text);font-size:14px;font-weight:700;text-align:center;outline:none;">
        <span style="font-size:12px;color:var(--text3)">leads trouvés dans ce compte</span>
      </div>
    </div>
    <div>
      <label class="detail-label">Niche</label>
      <select id="edit-niche" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;outline:none;margin-top:4px;">
        <option value="">— Choisir —</option>
        ${Object.entries(NICHES).map(([k,v]) => `<option value="${k}" ${mine.niche === k ? "selected" : ""}>${v}</option>`).join("")}
      </select>
    </div>
    <div>
      <label class="detail-label">Source</label>
      <select id="edit-source" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;outline:none;margin-top:4px;">
        <option value="">— Choisir —</option>
        ${Object.entries(SOURCES).map(([k,v]) => `<option value="${k}" ${mine.source === k ? "selected" : ""}>${v}</option>`).join("")}
      </select>
    </div>
    <div>
      <label class="detail-label">Notes</label>
      <textarea id="edit-notes" style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;outline:none;box-sizing:border-box;resize:vertical;min-height:70px;margin-top:4px;">${mine.notes || ""}</textarea>
    </div>
    <button id="btn-save-edit" class="btn-primary">💾 Sauvegarder</button>
  `;

  document.getElementById("edit-modal").classList.remove("hidden");

  // Statut buttons
  let selectedStatut = mine.statut;
  document.querySelectorAll(".mine-statut-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedStatut = btn.dataset.statut;
      document.querySelectorAll(".mine-statut-btn").forEach(b => {
        const sv = STATUTS_MINE[b.dataset.statut];
        b.style.background   = "var(--bg3)";
        b.style.borderColor  = "var(--border2)";
        b.style.color        = "var(--text2)";
        b.style.fontWeight   = "400";
      });
      const sv = STATUTS_MINE[selectedStatut];
      btn.style.background  = sv.color + "22";
      btn.style.borderColor = sv.color;
      btn.style.color       = sv.color;
      btn.style.fontWeight  = "700";
    });
  });

  document.getElementById("btn-save-edit").addEventListener("click", async () => {
    await updateMine(currentMineId, {
      statut:   selectedStatut,
      nb_leads: parseInt(document.getElementById("edit-nb-leads").value) || 0,
      niche:    document.getElementById("edit-niche").value || null,
      source:   document.getElementById("edit-source").value || null,
      notes:    document.getElementById("edit-notes").value.trim(),
    });
    document.getElementById("edit-modal").classList.add("hidden");
    loadStats();
    loadMines();
  });
}

window._editMine = openEditModal;

window._deleteMine = async (id, compte) => {
  if (!confirm(`Supprimer la mine ${compte} ?`)) return;
  await deleteMine(id);
  loadStats();
  loadMines();
};

window.initMines = function() {
  loadStats();
  loadMines();

  document.getElementById("filter-statut").addEventListener("change", loadMines);
  document.getElementById("filter-niche").addEventListener("change",  loadMines);

  document.getElementById("btn-add-mine").addEventListener("click", () => {
    document.getElementById("add-modal").classList.remove("hidden");
    document.getElementById("new-compte").focus();
  });

  document.getElementById("btn-confirm-add").addEventListener("click", async () => {
    const compte = document.getElementById("new-compte").value.trim();
    if (!compte) { document.getElementById("new-compte").style.borderColor = "#ef5350"; return; }
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
      document.getElementById("add-modal").classList.add("hidden");
      document.getElementById("new-compte").value = "";
      document.getElementById("new-niche").value  = "";
      document.getElementById("new-source").value = "";
      document.getElementById("new-notes").value  = "";
      loadStats();
      loadMines();
    } catch(e) {
      btn.textContent = "❌ Déjà existant";
      setTimeout(() => { btn.textContent = "✅ Ajouter la mine"; btn.disabled = false; }, 2000);
    }
    btn.textContent = "✅ Ajouter la mine";
    btn.disabled    = false;
  });
};
