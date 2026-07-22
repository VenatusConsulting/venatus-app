const STATUTS = {
  nouveau:       { label: "À contacter",    color: "#667eea" },
  contacte:      { label: "Contacté",       color: "#f59e0b" },
  en_discussion: { label: "En discussion",  color: "#29b6f6" },
  signe:         { label: "Signé",          color: "#4caf50" },
  refus:         { label: "Refus",          color: "#ef5350" },
  ghosted:       { label: "Ghosted",        color: "#888"    },
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

function getInitiales(pseudo) {
  const clean = pseudo.replace(/[@_\.]/g, " ").trim();
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#667eea","#764ba2","#f59e0b","#10b981","#ef5350","#29b6f6","#ec4899","#8b5cf6"];

function getAvatarColor(pseudo) {
  let hash = 0;
  for (const c of pseudo) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function setArc(id, pct) {
  const circ   = 213.6;
  const offset = circ - (circ * Math.min(pct, 100) / 100);
  const el     = document.getElementById(id);
  if (el) el.style.strokeDashoffset = offset;
}

function renderLead(lead, actionLabel, actionColor) {
  const initiales = getInitiales(lead.pseudo);
  const color     = getAvatarColor(lead.pseudo);
  const retard    = getRetard(lead.date_relance);
  const statut    = STATUTS[lead.statut] || STATUTS.nouveau;

  return `
    <div class="lead-item" onclick="openLead('${lead._id}')">
      <div class="lead-avatar" style="background:${color}">${initiales}</div>
      <div class="lead-info">
        <div class="lead-name">@${lead.pseudo}</div>
        <div class="lead-tags">
          <span class="lead-tag" style="color:${statut.color}">${statut.label}</span>
          ${retard ? `<span class="lead-tag retard-tag">⚠️ ${retard}j en retard</span>` : ""}
          ${lead.date_contact ? `<span class="lead-tag muted">⏱ ${daysSince(lead.date_contact)}j depuis contact</span>` : ""}
        </div>
      </div>
      <button
        class="action-btn"
        style="border-color:${actionColor};color:${actionColor}"
        onclick="event.stopPropagation();openLead('${lead._id}')"
      >${actionLabel}</button>
    </div>
  `;
}

function daysSince(dateStr) {
  if (!dateStr) return "?";
  const [d, m, y, h, min] = dateStr.split(/[\/\s:]/).map(Number);
  const date  = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - date) / (1000 * 60 * 60 * 24));
}

async function loadDashboard() {
  const [stats, goalData, relancesData, nouveaux] = await Promise.all([
    getStats(),
    getGoal(),
    getRelances(),
    getLeads({ statut: "nouveau", limit: 5 }),
  ]);

  const goal        = goalData.goal || 210;
  const goalParJour = Math.ceil(goal / 7);
  const dms         = stats.dms_today;
  const pctDms      = Math.round((dms / goalParJour) * 100);
  const reste       = Math.max(goalParJour - dms, 0);
  const totalRetard = relancesData.relances.length + relancesData.discussions.length;

  // Cercles
  document.getElementById("val-dms").textContent      = dms;
  document.getElementById("val-relances").textContent = stats.relances_today;
  document.getElementById("goal-par-jour").textContent = goalParJour;
  document.getElementById("relances-total").textContent = stats.relances_today + stats.discussions_attente;

  setTimeout(() => {
    setArc("arc-dms",      pctDms);
    setArc("arc-relances", Math.round((stats.relances_today / Math.max(stats.relances_today + stats.discussions_attente, 1)) * 100));
  }, 100);

  // Série
  document.getElementById("objectif-serie").textContent = dms >= goalParJour ? "🔥 Objectif atteint !" : `Objectif : ${goalParJour} contacts/jour`;

  // Sous-titre
  document.getElementById("objectif-sub").textContent = reste > 0
    ? `⚡ Il te reste ${reste} DMs à envoyer aujourd'hui`
    : "🔥 Objectif du jour atteint !";

  // Alerte retards
  if (totalRetard > 0) {
    const el = document.getElementById("alerte-retard");
    el.classList.remove("hidden");
    document.getElementById("alerte-title").textContent = `${totalRetard} lead${totalRetard > 1 ? "s" : ""} refroidissent — relance-les avant de les perdre`;
  }

  // À contacter (nouveaux leads)
  const contacterList = nouveaux.leads;
  document.getElementById("count-contacter").textContent = stats.nouveau;
  const listContacter = document.getElementById("list-contacter");
  if (contacterList.length) {
    listContacter.innerHTML = contacterList.map(l => renderLead(l, "Contacter →", "#667eea")).join("");
  } else {
    listContacter.innerHTML = '<div class="empty-section">Aucun nouveau lead</div>';
  }

  // Relances à faire
  document.getElementById("count-relances").textContent = relancesData.relances.length;
  const listRelances = document.getElementById("list-relances");
  if (relancesData.relances.length) {
    listRelances.innerHTML = relancesData.relances.map(l => renderLead(l, "Relancer →", "#f59e0b")).join("");
  } else {
    listRelances.innerHTML = '<div class="empty-section">✅ Aucune relance aujourd\'hui</div>';
  }

  // En discussion sans réponse
  document.getElementById("count-discussion").textContent = relancesData.discussions.length;
  const listDiscussion = document.getElementById("list-discussion");
  if (relancesData.discussions.length) {
    listDiscussion.innerHTML = relancesData.discussions.map(l => renderLead(l, "Suivre →", "#29b6f6")).join("");
  } else {
    listDiscussion.innerHTML = '<div class="empty-section">✅ Toutes les discussions sont à jour</div>';
  }

  // Pipeline simplifié
  const steps = [
    { key: "nouveau",       label: "Nouveaux",      count: stats.nouveau    },
    { key: "contacte",      label: "Contactés",     count: stats.contacte   },
    { key: "en_discussion", label: "En discussion", count: stats.discussion },
    { key: "signe",         label: "Signés",        count: stats.signe      },
  ];
  document.getElementById("pipeline-steps").innerHTML = steps.map((s, i) => `
    <div class="pipeline-step" onclick="window.location='leads.html?statut=${s.key}'">
      <div class="pipeline-count">${s.count}</div>
      <div class="pipeline-label">${s.label}</div>
    </div>
    ${i < steps.length - 1 ? '<div class="pipeline-arrow">→</div>' : ""}
  `).join("");
}

// Modal
async function openLead(id) {
  currentId  = id;
  const lead = await getLead(id);
  const s    = STATUTS[lead.statut] || STATUTS.nouveau;
  const retard = getRetard(lead.date_relance);

  document.getElementById("modal-pseudo").textContent = "@" + lead.pseudo;
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
      <div class="detail-row">
        <span class="detail-label">Ajouté le</span>
        <span>${lead.date_ajout || "—"}</span>
      </div>
      ${lead.date_contact ? `
        <div class="detail-row">
          <span class="detail-label">Contacté le</span>
          <span>${lead.date_contact}</span>
        </div>
      ` : ""}
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
  closeModal();
  loadDashboard();
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

loadDashboard();
