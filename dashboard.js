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

  // Funnel — chemin vers la signature
  const contacte   = stats.contacte   || 0;
  const discussion = stats.discussion || 0;
  const signe      = stats.signe      || 0;
  const base       = contacte || 1;

  const funnelSteps = [
    { label: "Contacté",      count: contacte,   pct: 100 },
    { label: "En discussion", count: discussion, pct: Math.round((discussion / base) * 100) },
    { label: "Signé",         count: signe,      pct: Math.round((signe / base) * 100) },
  ];

  document.getElementById("funnel-bars").innerHTML = funnelSteps.map(s => `
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

  // Insight
  const taux = stats.taux_reponse || 0;
  const needed = taux > 0 ? Math.ceil(100 / taux) : "?";
  document.getElementById("funnel-insight"
