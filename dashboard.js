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

async function loadDashboard() {
  const stats = await getStats();

  document.getElementById("date").textContent = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
  document.getElementById("total").textContent      = stats.total;
  document.getElementById("signe").textContent      = stats.signe;
  document.getElementById("discussion").textContent = stats.discussion;
  document.getElementById("taux").textContent       = stats.taux_reponse + "%";

  const dms   = stats.dms_today;
  const pct   = Math.min(Math.round((dms / 30) * 100), 100);
  document.getElementById("dms-today").textContent        = dms;
  document.getElementById("progress-bar").style.width     = pct + "%";
  document.getElementById("dms-today-badge").textContent  = dms >= 30 ? "🔥 Objectif atteint !" : `${pct}%`;
  document.getElementById("dms-today-badge").className    = "badge " + (dms >= 30 ? "green" : dms >= 20 ? "blue" : "");

  document.getElementById("relances-count").textContent    = stats.relances_today;
  document.getElementById("discussions-count").textContent = stats.discussions_attente;

  // Par statut
  const sg = document.getElementById("statut-grid");
  sg.innerHTML = Object.entries(STATUTS).map(([key, val]) => `
    <div class="statut-item" onclick="window.location='leads.html?statut=${key}'">
      <div class="statut-dot" style="background:${val.color}"></div>
      <div class="statut-label">${val.label}</div>
      <div class="statut-count">${stats[key] || 0}</div>
    </div>
  `).join("");

  // Par niche
  const ng = document.getElementById("niche-grid");
  ng.innerHTML = Object.entries(NICHES).map(([key, label]) => `
    <div class="niche-item" onclick="window.location='leads.html?niche=${key}'">
      <div class="niche-label">${label}</div>
      <div class="niche-count">${stats.par_niche[key] || 0}</div>
    </div>
  `).join("");
}

loadDashboard();
