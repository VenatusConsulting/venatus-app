import { getLeads, getLead, updateLead, addNote } from "./api-module.js";

const API = "https://venatus-api.onrender.com";

const STATUTS = {
  nouveau:       { label: "🆕 Nouveau",       color: "#667eea" },
  contacte:      { label: "📨 Contacté",      color: "#ffeb3b" },
  en_discussion: { label: "💬 En discussion", color: "#29b6f6" },
  signe:         { label: "✅ Signé",          color: "#4caf50" },
  refus:         { label: "❌ Refus",          color: "#ef5350" },
  ghosted:       { label: "👻 Ghosted",        color: "#888"    },
};

const NICHES = {
  influenceuse: "💋 Influenceuse",
  fitness:      "💪 Fitness",
  gaming:       "🎮 Gaming",
  cosplay:      "🎨 Cosplay",
};

let page = 0, total = 0, currentId = null, debounce = null;
const LIMIT = 20;

async function getComptesIG() {
  try {
    const res  = await fetch(`${API}/comptes-ig`);
    if (!res.ok) return ["@Popsy.Mel", "@Ceo.Maxime"];
    return res.json();
  } catch { return ["@Popsy.Mel", "@Ceo.Maxime"]; }
}

function getRetard(dateRelance) {
  if (!dateRelance) return null;
  const [d, m, y] = dateRelance.split("/").map(Number);
  const relance   = new Date(y, m - 1, d);
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - relance) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function getFilters() {
  return {
    statut: document.getElementById("filter-statut").value,
    niche:  document.getElementById("filter-niche").value,
    search: document.getElementById("search").value.trim(),
    limit:  LIMIT,
    skip:   page * LIMIT,
  };
}

async function loadLeads() {
  document.getElementById("leads-list").innerHTML = '<div class="loading">Chargement...</div>';
  const data = await getLeads(getFilters());
  total = data.total;
  document.getElementById("leads-total").textContent = total + " leads";
  renderLeads(data.leads);
  updatePagination();
}

function renderLeads(list) {
  const el = document.getElementById("leads-list");
  if (!list.length) { el.innerHTML = '<div class="empty">Aucun lead trouvé</div>'; return; }
  el.innerHTML = list.map(lead => {
    const s      = STATUTS[lead.statut] || STATUTS.nouveau;
    const n      = NICHES[lead.niche] || "";
    const retard = getRetard(lead.date_relance);
    return `
      <div class="lead-row" onclick="window._openLeadL('${lead._id}')">
        <div class="lead-main">
          <div class="lead-pseudo">${lead.pseudo}</div>
          <div class="lead-meta">
            ${n ? `<span class="tag">${n}</span>` : ""}
            ${lead.abonnes ? `<span class="tag">👥 ${lead.abonnes}</span>` : ""}
            ${lead.compte_ig ? `<span class="tag">📱 ${lead.compte_ig}</span>` : ""}
            ${retard ? `<span class="tag retard-tag">⚠️ ${retard}j de retard</span>`
              : lead.date_relance ? `<span class="tag">⏰ ${lead.date_relance}</span>` : ""}
          </div>
        </div>
        <div class="lead-statut" style="color:${s.color}">${s.label}</div>
      </div>
    `;
  }).join("");
}

function updatePagination() {
  const pages = Math.ceil(total / LIMIT);
  document.getElementById("page-info").textContent = `Page ${page + 1} / ${pages || 1}`;
  document.getElementById("prev-btn").disabled     = page === 0;
  document.getElementById("next-btn").disabled     = (page + 1) * LIMIT >= total;
}

async function openLead(id) {
  currentId  = id;
  const lead = await getLead(id);
  const s    = STATUTS[lead.statut] || STATUTS.nouveau;
  const retard = getRetard(lead.date_relance);

  // Récupère les comptes IG dispo depuis MongoDB via le bot
  // On utilise une liste statique + l'existant du lead
  const comptesBase = ["@Popsy.Mel", "@Ceo.Maxime"];
  if (lead.compte_ig && !comptesBase.includes(lead.compte_ig)) {
    comptesBase.push(lead.compte_ig);
  }

  document.getElementById("modal-pseudo").textContent = lead.pseudo;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-body").innerHTML = `
    <div class="lead-detail">
      <div class="detail-row"><span class="detail-label">Statut</span><span style="color:${s.color}">${s.label}</span></div>
      <div class="detail-row"><span class="detail-label">Lien</span><a href="${lead.lien}" target="_blank" class="link">${lead.lien || "—"}</a></div>
      <div class="detail-row"><span class="detail-label">Abonnés</span><span>${lead.abonnes || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Niche</span><span>${NICHES[lead.niche] || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Ajouté le</span><span>${lead.date_ajout || "—"}</span></div>
      ${lead.date_contact ? `<div class="detail-row"><span class="detail-label">Contacté le</span><span>${lead.date_contact}</span></div>` : ""}
      ${lead.dm_utilise ? `<div class="detail-row"><span class="detail-label">DM utilisé</span><span>${lead.dm_utilise.toUpperCase()}</span></div>` : ""}
      <div class="detail-row">
        <span class="detail-label">Compte IG</span>
        <div style="display:flex;gap:6px;align-items:center;flex:1;justify-content:flex-end;">
          <select id="compte-ig-select"
            style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 8px;color:var(--text);font-size:12px;outline:none;cursor:pointer;">
            <option value="">— Choisir —</option>
            ${comptesBase.map(c => `<option value="${c}" ${lead.compte_ig === c ? 'selected' : ''}>${c}</option>`).join("")}
            <option value="__nouveau__">➕ Nouveau compte...</option>
          </select>
          <button id="save-compte-ig" onclick="window._saveCompteIg()"
            style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 10px;color:var(--text2);font-size:12px;cursor:pointer;">
            Sauver
          </button>
        </div>
      </div>
      <div id="nouveau-compte-wrap" style="display:none;margin-top:6px;">
        <input type="text" id="nouveau-compte-input" placeholder="@NouveauCompte"
          style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:6px 10px;color:var(--text);font-size:12px;outline:none;">
      </div>
      ${lead.date_relance ? `<div class="detail-row"><span class="detail-label">Relance</span>
        <span ${retard ? 'style="color:#ef5350;font-weight:600;"' : ""}>
          ⏰ ${lead.date_relance}
          ${retard ? `<span class="retard-inline">⚠️ ${retard}j de retard</span>` : ""}
        </span></div>` : ""}
      ${lead.notes ? `<div class="detail-row notes"><span class="detail-label">Notes</span><span>${lead.notes}</span></div>` : ""}
    </div>
    <div class="modal-section">
      <div class="detail-label">Changer le statut</div>
      <div class="statut-buttons">
        ${Object.entries(STATUTS).map(([key, val]) => `
          <button class="btn-statut ${lead.statut === key ? 'active' : ''}" style="--color:${val.color}"
            onclick="window._changeStatutL('${key}')">${val.label}</button>
        `).join("")}
      </div>
    </div>
    <div class="modal-section">
      <div class="detail-label">Ajouter une note</div>
      <div class="note-input-wrap">
        <input type="text" id="note-input" placeholder="Ta note..." class="note-input">
        <button onclick="window._saveNoteL()" class="btn-primary">Ajouter</button>
      </div>
    </div>
  `;

  // Affiche le champ texte si "Nouveau compte" sélectionné
  document.getElementById("compte-ig-select").addEventListener("change", (e) => {
    const wrap = document.getElementById("nouveau-compte-wrap");
    wrap.style.display = e.target.value === "__nouveau__" ? "block" : "none";
  });
}

window._openLeadL = openLead;
window._changeStatutL = async (statut) => {
  await updateLead(currentId, { statut });
  window.closeModal();
  loadLeads();
};
window._saveNoteL = async () => {
  const note = document.getElementById("note-input").value.trim();
  if (!note) return;
  await addNote(currentId, note);
  openLead(currentId);
};
window._saveCompteIg = async () => {
  const select = document.getElementById("compte-ig-select");
  let val = select.value;

  if (val === "__nouveau__") {
    val = document.getElementById("nouveau-compte-input").value.trim();
    if (!val) return;
    if (!val.startsWith("@")) val = "@" + val;
  }

  if (!val) return;

  await updateLead(currentId, { compte_ig: val });
  const btn = document.getElementById("save-compte-ig");
  btn.textContent = "✅";
  btn.style.color = "var(--green)";
  setTimeout(() => { btn.textContent = "Sauver"; btn.style.color = "var(--text2)"; openLead(currentId); }, 1200);
};
window.closeModal = () => {
  document.getElementById("modal").classList.add("hidden");
  currentId = null;
};

window.initLeads = function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("statut")) document.getElementById("filter-statut").value = params.get("statut");
  if (params.get("niche"))  document.getElementById("filter-niche").value  = params.get("niche");

  document.getElementById("search").addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { page = 0; loadLeads(); }, 400);
  });
  document.getElementById("filter-statut").addEventListener("change", () => { page = 0; loadLeads(); });
  document.getElementById("filter-niche").addEventListener("change",  () => { page = 0; loadLeads(); });
  document.getElementById("prev-btn").addEventListener("click", () => { page--; loadLeads(); });
  document.getElementById("next-btn").addEventListener("click", () => { page++; loadLeads(); });

  loadLeads();
};
