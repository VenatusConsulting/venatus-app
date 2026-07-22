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

function daysSince(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(/[\/\s:]/);
  const date  = new Date(parts[2], parts[1] - 1, parts[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - date) / (1000 * 60 * 60 * 24));
}

function renderLeadRow(lead, actionLabel, actionColor) {
  const initiales = getInitiales(lead.pseudo);
  const color     = getAvatarColor(lead.pseudo);
  const retard    = getRetard(lead.date_relance);
  const since     = daysSince(lead.date_contact);
  const statut    = STATUTS[lead.statut] || STATUTS.nouveau;

  return `
    <div class="lead-item" onclick="openLead('${lead._id}')">
      <div class="lead-avatar" style="background:${color}">${initiales}</div>
      <div class="lead-info">
        <div class="lead-name">@${lead.pseudo}</div>
        <div class="lead-tags">
          <span class="lead-tag" style="color:${statut.color}">${statut.label}</span>
          ${retard ? `<span class="lead-tag" style="color:#ef5350">⚠️ ${retard}j en retard</span>` : ""}
          ${since !== null ? `<span class="lead-tag muted">⏱ ${since}j depuis contact</span>` : ""}
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

async function loadDashboard() {
  const [stats, goalData, relancesData] = await Promise.all([
    getStats(), getGoal(), getRelances()
  ]);

  const goal        = goalData.goal || 210;
  const goalParJour = Math.ceil(goal / 7);
  const dms         = stats.dms_today;
  const reste       = Math.max(goalParJour - dms, 0);
  const pctJour     = Math.min(Math.round((dms / goalParJour) * 100), 100);
  const pctWeek     = Math.min(Math.round((stats.contacte / goal) * 100), 100);
  const totalRetard = relancesData.relances.length + relancesData.discussions.length;

  document.getElementById("date").textContent = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long"
  });

  // Objectif du jour
  document.getElementById("objectif-day").innerHTML = `
    <div class="objectif-wrap">
      <div class="objectif-top">
        <div>
          <div class="objectif-title">🎯 Objectif du jour</div>
          <div class="objectif-sub">${goalParJour} DMs/jour pour atteindre ${goal}/semaine</div>
        </div>
        <div class="objectif-counter ${dms >= goalParJour ? 'done' : ''}">${dms}/${goalParJour}</div>
      </div>
      <div class="progress" style="margin-top:12px;">
        <div class="progress-bar" style="width:${pctJour}%"></div>
      </div>
      <div class="objectif-footer">
        ${dms >= goalParJour
          ? `<span class="objectif-ok">🔥 Objectif du jour atteint !</span>`
          : `<span class="objectif-reste">⚡ Il te reste <strong>${reste} DMs</strong> aujourd'hui</span>`
        }
        <span class="objectif-week">Goal hebdo : <strong>${pctWeek}%</strong></span>
      </div>
    </div>
  `;

  // Stats
  document.getElementById("total").textContent      = stats.total;
  document.getElementById("signe").textContent      = stats.signe;
  document.getElementById("discussion").textContent = stats.discussion;
  document.getElementById("taux").textContent       = stats.taux_reponse + "%";

  // Alerte retards
  if (totalRetard > 0) {
    const el = document.getElementById("alerte-retard");
    el.classList.remove("hidden");
    document.getElementById("alerte-title").textContent =
      `${totalRetard} lead${totalRetard > 1 ? "s" : ""} refroidissent — relance-les avant de les perdre`;
  }

  // Relances
  document.getElementById("count-relances").textContent = relancesData.relances.length;
  const listR = document.getElementById("list-relances");
  listR.innerHTML = relancesData.relances.length
    ? relancesData.relances.slice(0, 5).map(l => renderLeadRow(l, "Relancer →", "#f59e0b")).join("")
    : '<div class="empty">✅ Aucune relance aujourd\'hui</div>';

  // Discussions
  document.getElementById("count-discussion").textContent = relancesData.discussions.length;
  const listD = document.getElementById("list-discussion");
  listD.innerHTML = relancesData.discussions.length
    ? relancesData.discussions.slice(0, 5).map(l => renderLeadRow(l, "Suivre →", "#29b6f6")).join("")
    : '<div class="empty">✅ Toutes les discussions sont à jour</div>';

  // Pipeline steps
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

  // Par statut
  document.getElementById("statut-grid").innerHTML = Object.entries(STATUTS).map(([key, val]) => `
    <div class="statut-item" onclick="window.location='leads.html?statut=${key}'">
      <div class="statut-dot" style="background:${val.color}"></div>
      <div class="statut-label">${val.label}</div>
      <div class="statut-count">${stats[key] || 0}</div>
    </div>
  `).join("");

  // Par niche
  document.getElementById("niche-grid").innerHTML = Object.entries(NICHES).map(([key, label]) => `
    <div class="niche-item" onclick="window.location='leads.html?niche=${key}'">
      <div class="niche-label">${label}</div>
      <div class="niche-count">${stats.par_niche[key] || 0}</div>
    </div>
  `).join("");
}

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
