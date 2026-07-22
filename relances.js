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

function renderList(leads, containerId) {
  const el = document.getElementById(containerId);
  if (!leads.length) {
    el.innerHTML = '<div class="empty">Aucun lead ici 🎉</div>';
    return;
  }
  el.innerHTML = leads.map(lead => {
    const s      = STATUTS[lead.statut] || STATUTS.nouveau;
    const retard = getRetard(lead.date_relance);
    return `
      <div class="lead-row" onclick="openLead('${lead._id}')">
        <div class="lead-main">
          <div class="lead-pseudo">${lead.pseudo}</div>
          <div class="lead-meta">
            <span class="tag">👥 ${lead.abonnes || "?"}</span>
            ${retard
              ? `<span class="tag retard-tag">⚠️ ${retard}j de retard</span>`
              : lead.date_relance
                ? `<span class="tag">⏰ ${lead.date_relance}</span>`
                : ""
            }
          </div>
        </div>
        <div class="lead-statut" style="color:${s.color}">${s.label}</div>
      </div>
    `;
  }).join("");
}

async function loadRelances() {
  const data = await getRelances();
  document.getElementById("relances-count").textContent    = data.relances.length;
  document.getElementById("discussions-count").textContent = data.discussions.length;
  renderList(data.relances,    "relances-list");
  renderList(data.discussions, "discussions-list");
}

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
  loadRelances();
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

loadRelances();
