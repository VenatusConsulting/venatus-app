import { getLeads, getLead, updateLead, addNote, incrementRelance } from "./api-module.js";

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

function getRetard(dateRelance) {
  if (!dateRelance) return null;
  const [d, m, y] = dateRelance.split("/").map(Number);
  const relance   = new Date(y, m - 1, d);
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - relance) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function extractHeure(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(" ");
  return parts.length > 1 ? parts[1] : null;
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
            ${lead.abonnes   ? `<span class="tag">👥 ${lead.abonnes}</span>` : ""}
            ${lead.compte_ig ? `<span class="tag">📱 ${lead.compte_ig}</span>` : ""}
            ${lead.nb_relances > 0 ? `<span class="tag">🔁 ${lead.nb_relances} relance${lead.nb_relances > 1 ? "s" : ""}</span>` : ""}
            ${retard
              ? `<span class="tag retard-tag">⚠️ ${retard}j de retard</span>`
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
  currentId    = id;
  const lead   = await getLead(id);
  const s      = STATUTS[lead.statut] || STATUTS.nouveau;
  const retard = getRetard(lead.date_relance);
  const heureDM = lead.heure_dm || extractHeure(lead.date_contact);

  const comptesBase = ["@Popsy.Mel", "@Ceo.Maxime"];
  if (lead.compte_ig && !comptesBase.includes(lead.compte_ig)) {
    comptesBase.push(lead.compte_ig);
  }

  document.getElementById("modal-pseudo").textContent = lead.pseudo;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-body").innerHTML = `
    <div class="lead-detail">
      <div class="detail-row">
        <span class="detail-label">Statut</span>
        <span style="color:${s.color}">${s.label}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Lien</span>
        <a href="${lead.lien}" target="_blank" class="link">${lead.lien || "—"}</a>
      </div>
      <div class="detail-row">
        <span class="detail-label">Abonnés</span>
        <span>${lead.abonnes || "—"}</span>
