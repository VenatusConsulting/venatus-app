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

let page     = 0;
let total    = 0;
const LIMIT  = 20;
let debounce = null;

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
  const params = getFilters();
  const data   = await getLeads(params);
  total        = data.total;
  document.getElementById("leads-total").textContent = total + " leads";
  renderLeads(data.leads);
  updatePagination();
}

function renderLeads(list) {
  const el = document.getElementById("leads-list");
  if (!list.length) {
    el.innerHTML = '<div class="empty">Aucun lead trouvé</div>';
    return;
  }
  el.innerHTML = list.map(lead => {
    const s = STATUTS[lead.statut] || STATUTS.nouveau;
    const n = NICHES[lead.niche] || "";
    return `
      <div class="lead-row" onclick="openLead('${lead._id}')">
        <div class="lead-main">
          <div class="lead-pseudo">${lead.pseudo}</div>
          <div class="lead-meta">
            ${n ? `<span class="tag">${n}</span>` : ""}
            ${lead.abonnes ? `<span class="tag">👥 ${lead.abonnes}</span>` : ""}
            ${lead.date_relance ? `<span class="tag">⏰ ${lead.date_relance}</span>` : ""}
          </div>
        </div>
        <div class="lead-statut" style="color:${s.color}">${s.label}</div>
      </div>
    `;
  }).join("");
}

function updatePagination() {
  const pages = Math.ceil(total / LIMIT);
  document.getElementById("page-info").textContent   = `Page ${page + 1} / ${pages || 1}`;
  document.getElementById("prev-btn").disabled        = page === 0;
  document.getElementById("next-btn").disabled        = (page + 1) * LIMIT >= total;
}

// Modal
let currentId = null;

async function openLead(id) {
  currentId = id;
  const lead = await getLead(id);
  const s    = STATUTS[lead.statut] || STATUTS.nouveau;
  const n    = NICHES[lead.niche] || "—";

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
      </div>
      <div class="detail-row">
        <span class="detail-label">Niche</span>
        <span>${n}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Ajouté le</span>
        <span>${lead.date_ajout || "—"}</span>
      </div>
      ${lead.date_contact ? `<div class="detail-row"><span class="detail-label">Contacté le</span><span>${lead.date_contact}</span></div>` : ""}
      ${lead.date_relance ? `<div class="detail-row"><span class="detail-label">Relance</span><span>⏰ ${lead.date_relance}</span></div>` : ""}
      ${lead.dm_utilise ? `<div class="detail-row"><span class="detail-label">DM utilisé</span><span>${lead.dm_utilise.toUpperCase()}</span></div>` : ""}
      ${lead.notes ? `<div class="detail-row notes"><span class="detail-label">Notes</span><span>${lead.notes}</span></div>` : ""}
    </div>

    <div class="modal-section">
      <div class="detail-label">Changer le statut</div>
      <div class="statut-buttons">
        ${Object.entries(STATUTS).map(([key, val]) => `
          <button
            class="btn-statut ${lead.statut === key ? 'active' : ''}"
            style="--color:${val.color}"
            onclick="changeStatut('${key}')"
          >${val.label}</button>
        `).join("")}
      </div>
    </div>

    <div class="modal-section">
      <div class="detail-label">Ajouter une note</div>
      <div class="note-input-wrap">
        <input type="text" id="note-input" placeholder="Ta note..." class="note-input">
        <button onclick="saveNote()" class="btn-primary">Ajouter</button>
      </div>
    </div>
  `;
}

async function changeStatut(statut) {
  await updateLead(currentId, { statut });
  openLead(currentId);
  loadLeads();
}

async function saveNote() {
  const note = document.getElementById("note-input").value.trim();
  if (!note) return;
  await addNote(currentId, note);
  openLead(currentId);
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  currentId = null;
}

// Events
document.getElementById("search").addEventListener("input", () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => { page = 0; loadLeads(); }, 400);
});

document.getElementById("filter-statut").addEventListener("change", () => { page = 0; loadLeads(); });
document.getElementById("filter-niche").addEventListener("change",  () => { page = 0; loadLeads(); });
document.getElementById("prev-btn").addEventListener("click", () => { page--; loadLeads(); });
document.getElementById("next-btn").addEventListener("click", () => { page++; loadLeads(); });

// Params URL
const params = new URLSearchParams(window.location.search);
if (params.get("statut")) document.getElementById("filter-statut").value = params.get("statut");
if (params.get("niche"))  document.getElementById("filter-niche").value  = params.get("niche");

loadLeads();
