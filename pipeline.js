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

let allLeads  = [];
let currentId = null;

function getRetard(dateRelance) {
  if (!dateRelance) return null;
  const [d, m, y] = dateRelance.split("/").map(Number);
  const relance   = new Date(y, m - 1, d);
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - relance) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function renderKanban(leads) {
  const kanban = document.getElementById("kanban");
  document.getElementById("pipeline-total").textContent = leads.length + " leads";

  const byStatut = {};
  for (const key of Object.keys(STATUTS)) byStatut[key] = [];
  for (const lead of leads) {
    const s = lead.statut || "nouveau";
    if (byStatut[s]) byStatut[s].push(lead);
  }

  kanban.innerHTML = Object.entries(STATUTS).map(([key, val]) => {
    const list   = byStatut[key];
    const cards  = list.map(lead => {
      const retard = getRetard(lead.date_relance);
      const niche  = NICHES[lead.niche] || "";

      return `
        <div
          class="kanban-card ${retard ? 'retard' : ''}"
          onclick="openLead('${lead._id}')"
          draggable="true"
          ondragstart="dragStart(event, '${lead._id}')"
        >
          <div class="kanban-card-pseudo">${lead.pseudo}</div>
          <div class="kanban-card-meta">
            ${lead.abonnes ? `<span class="tag">👥 ${lead.abonnes}</span>` : ""}
            ${niche        ? `<span class="tag">${niche}</span>` : ""}
          </div>
          ${retard ? `
            <div class="retard-badge">
              ⚠️ Retard de ${retard} jour${retard > 1 ? "s" : ""}
            </div>
          ` : lead.date_relance ? `
            <div class="relance-badge">⏰ ${lead.date_relance}</div>
          ` : ""}
        </div>
      `;
    }).join("");

    return `
      <div
        class="kanban-col"
        ondragover="event.preventDefault()"
        ondrop="dragDrop(event, '${key}')"
      >
        <div class="kanban-col-header" style="border-top: 3px solid ${val.color}">
          <span class="kanban-col-title">${val.label}</span>
          <span class="kanban-col-count" style="color:${val.color}">${list.length}</span>
        </div>
        <div class="kanban-col-body" id="col-${key}">
          ${cards || '<div class="kanban-empty">Aucun lead</div>'}
        </div>
      </div>
    `;
  }).join("");
}

// Drag & drop
let draggedId = null;

function dragStart(event, id) {
  draggedId = id;
  event.dataTransfer.effectAllowed = "move";
}

async function dragDrop(event, newStatut) {
  event.preventDefault();
  if (!draggedId) return;
  await updateLead(draggedId, { statut: newStatut });
  draggedId = null;
  loadPipeline();
}

// Modal
async function openLead(id) {
  currentId  = id;
  const lead = await getLead(id);
  const s    = STATUTS[lead.statut] || STATUTS.nouveau;
  const retard = getRetard(lead.date_relance);

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
        <span>${NICHES[lead.niche] || "—"}</span>
      </div>
      ${lead.date_relance ? `
        <div class="detail-row">
          <span class="detail-label">Relance</span>
          <span ${retard ? 'style="color:#ef5350;font-weight:600;"' : ""}>
            ⏰ ${lead.date_relance}
            ${retard ? `<span class="retard-inline">⚠️ ${retard}j de retard</span>` : ""}
          </span>
        </div>
      ` : ""}
      ${lead.notes ? `
        <div class="detail-row notes">
          <span class="detail-label">Notes</span>
          <span>${lead.notes}</span>
        </div>
      ` : ""}
    </div>

    <div class="modal-section">
      <div class="detail-label">Déplacer vers</div>
      <div class="statut-buttons">
        ${Object.entries(STATUTS).map(([key, val]) => `
          <button
            class="btn-statut ${lead.statut === key ? 'active' : ''}"
            style="--color:${val.color}"
            onclick="moveToStatut('${key}')"
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

async function moveToStatut(statut) {
  await updateLead(currentId, { statut });
  closeModal();
  loadPipeline();
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

async function loadPipeline() {
  const data = await getLeads({ limit: 200 });
  allLeads   = data.leads;
  renderKanban(allLeads);
}

loadPipeline();
