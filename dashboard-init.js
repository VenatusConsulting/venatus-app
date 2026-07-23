import { getStats, getGoal, getRelances, getLead, updateLead, addNote } from "./api-module.js";

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
    <div class="lead-item" onclick="window._openLead('${lead._id}')">
      <div class="lead-avatar" style="background:${color}">${initiales}</div>
      <div class="lead-info">
        <div class="lead-name">@${lead.pseudo}</div>
        <div class="lead-tags">
          <span class="lead-tag" style="color:${statut.color}">${statut.label}</span>
          ${retard ? `<span class="lead-tag" style="color:#ef5350">⚠️ ${retard}j en retard</span>` : ""}
          ${since !== null ? `<span class="lead-tag muted">⏱ ${since}j depuis contact</span>` : ""}
          ${lead.compte_ig ? `<span class="lead-tag muted">📱 ${lead.compte_ig}</span>` : ""}
        </div>
      </div>
      <button class="action-btn" style="border-color:${actionColor};color:${actionColor}"
        onclick="event.stopPropagation();window._openLead('${lead._id}')"
      >${actionLabel}</button>
    </div>
  `;
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
      <div class="detail-row"><span class="detail-label">Statut</span><span style="color:${s.color}">${s.label}</span></div>
      <div class="detail-row"><span class="detail-label">Lien</span><a href="${lead.lien}" target="_blank" class="link">${lead.lien || "—"}</a></div>
      <div class="detail-row"><span class="detail-label">Abonnés</span><span>${lead.abonnes || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Niche</span><span>${NICHES[lead.niche] || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Ajouté le</span><span>${lead.date_ajout || "—"}</span></div>
      ${lead.date_contact ? `<div class="detail-row"><span class="detail-label">Contacté le</span><span>${lead.date_contact}</span></div>` : ""}
      ${lead.dm_utilise ? `<div class="detail-row"><span class="detail-label">DM utilisé</span><span>${lead.dm_utilise.toUpperCase()}</span></div>` : ""}
      <div class="detail-row">
        <span class="detail-label">Compte IG</span>
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="text" id="compte-ig-input" value="${lead.compte_ig || ''}"
            placeholder="@moncompte"
            style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 8px;color:var(--text);font-size:12px;outline:none;width:130px;">
          <button id="save-compte-ig" onclick="window._saveCompteIg()"
            style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 10px;color:var(--text2);font-size:12px;cursor:pointer;">
            Sauver
          </button>
        </div>
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
            onclick="window._changeStatut('${key}')">${val.label}</button>
        `).join("")}
      </div>
    </div>
    <div class="modal-section">
      <div class="detail-label">Ajouter une note</div>
      <div class="note-input-wrap">
        <input type="text" id="note-input" placeholder="Ta note..." class="note-input">
        <button onclick="window._saveNote()" class="btn-primary">Ajouter</button>
      </div>
    </div>
  `;
}

window._openLead = openLead;
window._changeStatut = async (statut) => {
  await updateLead(currentId, { statut });
  window.closeModal();
  window.initDashboard();
};
window._saveNote = async () => {
  const note = document.getElementById("note-input").value.trim();
  if (!note) return;
  await addNote(currentId, note);
  openLead(currentId);
};
window._saveCompteIg = async () => {
  const val = document.getElementById("compte-ig-input").value.trim();
  await updateLead(currentId, { compte_ig: val });
  const btn = document.getElementById("save-compte-ig");
  btn.textContent = "✅";
  btn.style.color = "var(--green)";
  setTimeout(() => { btn.textContent = "Sauver"; btn.style.color = "var(--text2)"; }, 1500);
};
window.closeModal = () => {
  document.getElementById("modal").classList.add("hidden");
  currentId = null;
};

window.initDashboard = async function() {
  const [stats, goalData, relancesData] = await Promise.all([getStats(), getGoal(), getRelances()]);

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

  document.getElementById("total").textContent      = stats.total;
  document.getElementById("signe").textContent      = stats.signe;
  document.getElementById("discussion").textContent = stats.discussion;
  document.getElementById("taux").textContent       = stats.taux_reponse + "%";

  if (totalRetard > 0) {
    const el = document.getElementById("alerte-retard");
    el.classList.remove("hidden");
    document.getElementById("alerte-title").textContent =
      `${totalRetard} lead${totalRetard > 1 ? "s" : ""} refroidissent — relance-les avant de les perdre`;
  }

  document.getElementById("count-relances").textContent = relancesData.relances.length;
  const listR = document.getElementById("list-relances");
  listR.innerHTML = relancesData.relances.length
    ? relancesData.relances.slice(0, 5).map(l => renderLeadRow(l, "Relancer →", "#f59e0b")).join("")
    : '<div class="empty">✅ Aucune relance aujourd\'hui</div>';

  document.getElementById("count-discussion").textContent = relancesData.discussions.length;
  const listD = document.getElementById("list-discussion");
  listD.innerHTML = relancesData.discussions.length
    ? relancesData.discussions.slice(0, 5).map(l => renderLeadRow(l, "Suivre →", "#29b6f6")).join("")
    : '<div class="empty">✅ Toutes les discussions sont à jour</div>';

  const contacte   = stats.contacte   || 0;
  const discussion = stats.discussion || 0;
  const signe      = stats.signe      || 0;
  const base       = contacte || 1;
  const taux       = contacte > 0 ? Math.round((discussion / contacte) * 100) : 0;

  document.getElementById("funnel-bars").innerHTML = [
    { label: "Contacté",      count: contacte,   pct: 100 },
    { label: "En discussion", count: discussion, pct: Math.round((discussion / base) * 100) },
    { label: "Signé",         count: signe,      pct: Math.round((signe / base) * 100) },
  ].map(s => `
    <div class="funnel-row">
      <div class="funnel-label">${s.label}</div>
      <div class="funnel-bar-wrap">
        <div class="funnel-bar-bg">
          <div class="funnel-bar-fill" style="width:${s.pct}%"></div>
          <span class="funnel-bar-count">${s.count}</span>
        </div>
      </div>
      <div class="funnel-pct">${s.pct}%</div>
    </div>
  `).join("");

  const needed = taux > 0 ? Math.ceil(100 / taux) : "?";
  document.getElementById("funnel-insight").innerHTML = `
    À ton rythme actuel (<strong>${taux}% de réponse</strong>),
    contacte ~<strong style="color:#f59e0b">${needed}</strong> profils de plus pour signer ta prochaine modèle.
  `;

  document.getElementById("kpi-grid").innerHTML = `
    <div class="kpi-card"><div class="kpi-icon">👥</div><div class="kpi-value">${stats.total}</div><div class="kpi-label">Leads en pipeline</div></div>
    <div class="kpi-card"><div class="kpi-icon">⏰</div><div class="kpi-value">${stats.relances_today}</div><div class="kpi-label">Relances dues aujourd'hui</div></div>
    <div class="kpi-card"><div class="kpi-icon">📈</div><div class="kpi-value">${stats.taux_reponse}%</div><div class="kpi-label">Taux de réponse</div></div>
    <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-value">${stats.signe}</div><div class="kpi-label">Signés au total</div></div>
  `;

  document.getElementById("statut-grid").innerHTML = Object.entries(STATUTS).map(([key, val]) => `
    <div class="statut-item" onclick="window.location='leads.html?statut=${key}'">
      <div class="statut-dot" style="background:${val.color}"></div>
      <div class="statut-label">${val.label}</div>
      <div class="statut-count">${stats[key] || 0}</div>
    </div>
  `).join("");

  document.getElementById("niche-grid").innerHTML = Object.entries(NICHES).map(([key, label]) => `
    <div class="niche-item" onclick="window.location='leads.html?niche=${key}'">
      <div class="niche-label">${label}</div>
      <div class="niche-count">${stats.par_niche[key] || 0}</div>
    </div>
  `).join("");
};
