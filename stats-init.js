import { getStatsDM, getStatsComptes, getStatsNiches, getStatsTendances, getStatsProfils, getStatsTiming } from "./api-module.js";

const DM_TEMPLATES_TEXT = {
  dm1: { label: "DM 1 — Compliment physique", text: "omgg you are so pretty girl! 💗" },
  dm2: { label: "DM 2 — Girl energy",          text: "idk why but you just have THAT girl energy 💅✨" },
  dm3: { label: "DM 3 — Feed + question",      text: "I love your feed 😍 how long have you been posting?" },
  dm4: { label: "DM 4 — Underrated",           text: "ok but why are you so underrated?? 👀" },
};

const DM_COLORS     = { dm1: "#667eea", dm2: "#f59e0b", dm3: "#10b981", dm4: "#ec4899" };
const NICHE_LABELS  = { influenceuse: "💋 Influenceuse", fitness: "💪 Fitness", gaming: "🎮 Gaming", cosplay: "🎨 Cosplay" };
const NICHE_COLORS  = { influenceuse: "#ec4899", fitness: "#10b981", gaming: "#667eea", cosplay: "#f59e0b" };
const COMPTE_COLORS = ["#667eea","#f59e0b","#10b981","#ec4899","#29b6f6","#8b5cf6"];

function taux_color(taux) {
  if (taux >= 30) return "var(--green)";
  if (taux >= 15) return "var(--yellow)";
  return "var(--text3)";
}

function fmt_num(n) {
  if (n == null) return "—";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000)    return Math.round(n / 1000) + "K";
  return n.toString();
}

function fmt_heure(h) {
  return `${String(h).padStart(2,"0")}h`;
}

function renderBars(items, labelFn, colorFn) {
  const max = Math.max(...items.map(v => v.taux), 1);
  return items.map(item => `
    <div class="dm-bar-row">
      <div class="dm-bar-label">${labelFn(item)}</div>
      <div class="dm-bar-wrap">
        <div class="dm-bar-bg">
          <div class="dm-bar-fill" style="width:${Math.round((item.taux/max)*100)}%;background:${colorFn(item)}"></div>
          <span class="dm-bar-count">${item.taux}%</span>
        </div>
      </div>
      <div class="dm-bar-info">${item.reponses}/${item.total}</div>
    </div>
  `).join("");
}

function renderHourBars(values, color) {
  const max = Math.max(...values, 1);
  return `
    <div class="hour-chart">
      ${values.map((v, h) => `
        <div class="hour-col">
          <div class="hour-bar-wrap">
            <div class="hour-bar" style="height:${Math.round((v/max)*100)}%;background:${color}"></div>
          </div>
          <div class="hour-val">${v > 0 ? v : ""}</div>
          <div class="hour-label">${fmt_heure(h)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderTable(headers, rows) {
  return `
    <table class="dm-table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
  `;
}

// ── DM ──────────────────────────────────────────────────────────────────────

async function loadDM() {
  const data    = await getStatsDM();
  const entries = Object.entries(data);
  if (!entries.length) return;
  const best = entries.reduce((a, b) => b[1].taux > a[1].taux ? b : a, entries[0]);

  const [key, b] = best;
  document.getElementById("best-dm-card").innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="font-size:32px;">🏆</div>
      <div>
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Meilleur DM</div>
        <div style="font-size:18px;font-weight:700;color:${DM_COLORS[key]}">${DM_TEMPLATES_TEXT[key].label}</div>
        <div style="font-size:13px;color:var(--text2);margin-top:4px;font-style:italic;">"${DM_TEMPLATES_TEXT[key].text}"</div>
        <div style="margin-top:8px;display:flex;gap:16px;font-size:13px;">
          <span style="color:var(--text2)">📨 <strong>${b.total}</strong> envoyés</span>
          <span style="color:var(--green)">💬 <strong>${b.reponses}</strong> réponses</span>
          <span style="color:var(--yellow)">🔥 <strong>${b.taux}%</strong> taux</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById("dm-bars").innerHTML = renderBars(
    entries.map(([k,v]) => ({...v, key: k})),
    item => DM_TEMPLATES_TEXT[item.key]?.label || item.key,
    item => DM_COLORS[item.key]
  );

  const sorted = [...entries].sort((a,b) => b[1].taux - a[1].taux);
  document.getElementById("dm-table").innerHTML = renderTable(
    ["DM", "Envoyés", "Réponses", "Signés", "Taux", "Rang"],
    sorted.map(([key, val], i) => `
      <tr>
        <td style="color:${DM_COLORS[key]};font-weight:600;">${DM_TEMPLATES_TEXT[key]?.label || key}</td>
        <td>${val.total}</td><td>${val.reponses}</td><td>${val.signes}</td>
        <td><span style="color:${taux_color(val.taux)};font-weight:700;">${val.taux}%</span></td>
        <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
      </tr>
    `)
  );

  document.getElementById("dm-templates").innerHTML = entries.map(([key, val]) => `
    <div class="template-card">
      <div class="template-header">
        <span class="template-label" style="color:${DM_COLORS[key]}">${DM_TEMPLATES_TEXT[key]?.label || key}</span>
        <span style="color:${taux_color(val.taux)};font-size:12px;font-weight:600;">${val.taux}% réponses</span>
      </div>
      <div class="template-text">"${DM_TEMPLATES_TEXT[key]?.text || ""}"</div>
      <div class="template-stats">
        <span>📨 ${val.total} envoyés</span>
        <span>💬 ${val.reponses} réponses</span>
        <span>✅ ${val.signes} signés</span>
      </div>
    </div>
  `).join("");
}

// ── Comptes IG ───────────────────────────────────────────────────────────────

async function loadComptes() {
  const data = await getStatsComptes();
  if (!data.length) {
    ["best-compte-card","comptes-bars","comptes-table"].forEach(id =>
      document.getElementById(id).innerHTML = '<div class="empty">Aucun compte IG enregistré</div>'
    );
    return;
  }
  const best = data[0];
  document.getElementById("best-compte-card").innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="font-size:32px;">🏆</div>
      <div>
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Meilleur compte IG</div>
        <div style="font-size:22px;font-weight:700;color:${COMPTE_COLORS[0]}">${best.compte}</div>
        <div style="margin-top:8px;display:flex;gap:16px;font-size:13px;">
          <span style="color:var(--text2)">📨 <strong>${best.total}</strong> DMs</span>
          <span style="color:var(--green)">💬 <strong>${best.reponses}</strong> réponses</span>
          <span style="color:var(--yellow)">🔥 <strong>${best.taux}%</strong> taux</span>
        </div>
      </div>
    </div>
  `;
  document.getElementById("comptes-bars").innerHTML = renderBars(
    data,
    item => item.compte,
    item => COMPTE_COLORS[data.indexOf(item) % COMPTE_COLORS.length]
  );
  document.getElementById("comptes-table").innerHTML = renderTable(
    ["Compte", "DMs envoyés", "Réponses", "Signés", "Taux", "Rang"],
    data.map((item, i) => `
      <tr>
        <td style="color:${COMPTE_COLORS[i % COMPTE_COLORS.length]};font-weight:600;">${item.compte}</td>
        <td>${item.total}</td><td>${item.reponses}</td><td>${item.signes}</td>
        <td><span style="color:${taux_color(item.taux)};font-weight:700;">${item.taux}%</span></td>
        <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
      </tr>
    `)
  );
}

// ── Niches ───────────────────────────────────────────────────────────────────

async function loadNiches() {
  const data = await getStatsNiches();
  if (!data.length || data.every(n => n.total === 0)) {
    ["best-niche-card","niches-bars","niches-table"].forEach(id =>
      document.getElementById(id).innerHTML = '<div class="empty">Pas encore assez de données</div>'
    );
    return;
  }
  const best = data[0];
  document.getElementById("best-niche-card").innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="font-size:32px;">🏆</div>
      <div>
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Meilleure niche</div>
        <div style="font-size:22px;font-weight:700;color:${NICHE_COLORS[best.niche]}">${NICHE_LABELS[best.niche] || best.niche}</div>
        <div style="margin-top:8px;display:flex;gap:16px;font-size:13px;">
          <span style="color:var(--text2)">👥 <strong>${best.total}</strong> leads</span>
          <span style="color:var(--green)">💬 <strong>${best.reponses}</strong> réponses</span>
          <span style="color:var(--yellow)">🔥 <strong>${best.taux}%</strong> taux</span>
        </div>
      </div>
    </div>
  `;
  document.getElementById("niches-bars").innerHTML = renderBars(
    data,
    item => NICHE_LABELS[item.niche] || item.niche,
    item => NICHE_COLORS[item.niche] || "#667eea"
  );
  document.getElementById("niches-table").innerHTML = renderTable(
    ["Niche", "Total", "Contactées", "Réponses", "Signés", "Taux", "Rang"],
    data.map((item, i) => `
      <tr>
        <td style="color:${NICHE_COLORS[item.niche]};font-weight:600;">${NICHE_LABELS[item.niche] || item.niche}</td>
        <td>${item.total}</td><td>${item.contacte}</td><td>${item.reponses}</td><td>${item.signes}</td>
        <td><span style="color:${taux_color(item.taux)};font-weight:700;">${item.taux}%</span></td>
        <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
      </tr>
    `)
  );
}

// ── Tendances ────────────────────────────────────────────────────────────────

async function loadTendances() {
  const data      = await getStatsTendances();
  const maxAjouts = Math.max(...data.map(d => d.ajouts), 1);
  const maxTaux   = Math.max(...data.map(d => d.taux), 1);

  document.getElementById("tendances-ajouts").innerHTML = `
    <div class="tendance-chart">
      ${data.map(d => `
        <div class="tendance-col">
          <div class="tendance-bar-wrap">
            <div class="tendance-bar" style="height:${Math.round((d.ajouts/maxAjouts)*100)}%;background:var(--purple)"></div>
          </div>
          <div class="tendance-val">${d.ajouts}</div>
          <div class="tendance-label">${d.semaine}</div>
        </div>
      `).join("")}
    </div>
  `;

  document.getElementById("tendances-taux").innerHTML = `
    <div class="tendance-chart">
      ${data.map(d => `
        <div class="tendance-col">
          <div class="tendance-bar-wrap">
            <div class="tendance-bar" style="height:${Math.round((d.taux/Math.max(maxTaux,1))*100)}%;background:${taux_color(d.taux)}"></div>
          </div>
          <div class="tendance-val" style="color:${taux_color(d.taux)}">${d.taux}%</div>
          <div class="tendance-label">${d.semaine}</div>
        </div>
      `).join("")}
    </div>
  `;

  document.getElementById("tendances-table").innerHTML = renderTable(
    ["Semaine", "Leads ajoutés", "Contactées", "Réponses", "Taux"],
    data.map(d => `
      <tr>
        <td style="font-weight:600;">${d.semaine}</td>
        <td>${d.ajouts}</td><td>${d.contactes}</td><td>${d.reponses}</td>
        <td><span style="color:${taux_color(d.taux)};font-weight:700;">${d.taux}%</span></td>
      </tr>
    `)
  );
}

// ── Profils ──────────────────────────────────────────────────────────────────

async function loadProfils() {
  const data = await getStatsProfils();

  const kpis = [
    { icon: "👥", label: "Abonnés moyens (tous leads)",    val: fmt_num(data.tous?.moyenne) },
    { icon: "💬", label: "Abonnés moyens (qui répondent)", val: fmt_num(data.repondeurs?.moyenne), color: "var(--green)" },
    { icon: "✅", label: "Abonnés moyens (signés)",        val: fmt_num(data.signes?.moyenne),    color: "var(--yellow)" },
    { icon: "📊", label: "Médiane (qui répondent)",        val: fmt_num(data.repondeurs?.mediane) },
    { icon: "🔽", label: "Min followers répondeurs",       val: fmt_num(data.repondeurs?.min) },
    { icon: "🔼", label: "Max followers répondeurs",       val: fmt_num(data.repondeurs?.max) },
  ];

  document.getElementById("profils-kpis").innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-value" style="${k.color ? `color:${k.color}` : ""}">${k.val}</div>
      <div class="kpi-label">${k.label}</div>
    </div>
  `).join("");

  const moy_rep  = data.repondeurs?.moyenne;
  const moy_tous = data.tous?.moyenne;
  let insight    = "";
  if (moy_rep && moy_tous) {
    const diff = moy_rep > moy_tous ? "plus gros" : "plus petits";
    insight = `Les profils qui répondent ont en moyenne <strong style="color:var(--green)">${fmt_num(moy_rep)} abonnés</strong> — des comptes ${diff} que la moyenne de tes leads (${fmt_num(moy_tous)}).`;
  } else if (moy_tous) {
    insight = `Tu as des données sur ${data.tous?.count} leads avec une moyenne de <strong style="color:var(--purple)">${fmt_num(moy_tous)} abonnés</strong>. Continue à renseigner les abonnés pour voir qui répond le mieux.`;
  } else {
    insight = "Pas encore assez de données. Renseigne les abonnés de tes leads pour voir les insights.";
  }
  if (data.signes?.moyenne) {
    insight += ` Tes leads signés ont en moyenne <strong style="color:var(--yellow)">${fmt_num(data.signes.moyenne)} abonnés</strong>.`;
  }
  document.getElementById("profils-insight").innerHTML = insight;

  const tranches = data.tranches || {};
  const maxTaux  = Math.max(...Object.values(tranches).map(t => t.taux), 1);

  document.getElementById("profils-tranches").innerHTML = Object.entries(tranches).map(([tranche, val]) => {
    const pct   = Math.round((val.taux / Math.max(maxTaux, 1)) * 100);
    const color = val.taux >= 30 ? "var(--green)" : val.taux >= 15 ? "var(--yellow)" : "#667eea";
    return `
      <div class="dm-bar-row">
        <div class="dm-bar-label" style="width:110px;flex-shrink:0;">${tranche}</div>
        <div class="dm-bar-wrap">
          <div class="dm-bar-bg">
            <div class="dm-bar-fill" style="width:${pct}%;background:${color}"></div>
            <span class="dm-bar-count">${val.taux}%</span>
          </div>
        </div>
        <div class="dm-bar-info">${val.reponses}/${val.total}</div>
      </div>
    `;
  }).join("");

  document.getElementById("profils-table").innerHTML = renderTable(
    ["Tranche followers", "Leads contactés", "Réponses", "Taux"],
    Object.entries(tranches).map(([tranche, val]) => `
      <tr>
        <td style="font-weight:600;">${tranche}</td>
        <td>${val.total}</td><td>${val.reponses}</td>
        <td><span style="color:${taux_color(val.taux)};font-weight:700;">${val.taux}%</span></td>
      </tr>
    `)
  );
}

// ── Timing ───────────────────────────────────────────────────────────────────

async function loadTiming() {
  const data = await getStatsTiming();

  // Best hour card
  const bh = data.meilleure_heure;
  const hasData = data.heures_envoi.some(v => v > 0);

  document.getElementById("timing-best-card").innerHTML = hasData ? `
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="font-size:32px;">⏰</div>
      <div>
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Meilleure heure d'envoi</div>
        <div style="font-size:28px;font-weight:700;color:var(--purple)">${fmt_heure(bh.heure)}</div>
        <div style="margin-top:8px;display:flex;gap:16px;font-size:13px;">
          <span style="color:var(--text2)">📨 <strong>${bh.envoyes}</strong> DMs envoyés</span>
          <span style="color:var(--green)">💬 <strong>${bh.reponses}</strong> réponses</span>
          <span style="color:var(--yellow)">🔥 <strong>${bh.taux}%</strong> taux</span>
        </div>
      </div>
    </div>
  ` : `<div class="empty">Pas encore assez de données — envoie des DMs et marque l'heure de réponse pour voir les insights</div>`;

  // Barres heures envoi
  document.getElementById("timing-envoi").innerHTML = renderHourBars(data.heures_envoi, "var(--purple)");

  // Barres heures réponse
  document.getElementById("timing-reponse").innerHTML = renderHourBars(data.heures_reponse, "var(--green)");

  // Taux par heure
  const maxTaux = Math.max(...data.taux_par_heure.map(h => h.taux), 1);
  document.getElementById("timing-taux").innerHTML = `
    <div class="hour-chart">
      ${data.taux_par_heure.map(h => `
        <div class="hour-col">
          <div class="hour-bar-wrap">
            <div class="hour-bar" style="height:${Math.round((h.taux/Math.max(maxTaux,1))*100)}%;background:${taux_color(h.taux)}"></div>
          </div>
          <div class="hour-val" style="color:${taux_color(h.taux)}">${h.taux > 0 ? h.taux + "%" : ""}</div>
          <div class="hour-label">${fmt_heure(h.heure)}</div>
        </div>
      `).join("")}
    </div>
  `;

  // Moyenne relances
  document.getElementById("timing-relances").innerHTML = `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:48px;font-weight:700;color:var(--purple)">${data.moy_relances}</div>
      <div style="font-size:13px;color:var(--text3);margin-top:6px;">relances en moyenne avant réponse</div>
      <div style="font-size:12px;color:var(--text3);margin-top:4px;">${data.total_tracked} leads trackés</div>
    </div>
    ${data.total_tracked === 0 ? '<div class="empty">Les relances seront comptées automatiquement</div>' : ""}
  `;

  // Distribution relances
  const distrib  = data.distrib_relances;
  const distribEntries = Object.entries(distrib);
  const maxDistrib = Math.max(...distribEntries.map(([,v]) => v), 1);
  document.getElementById("timing-distrib").innerHTML = distribEntries.map(([label, count]) => `
    <div class="dm-bar-row">
      <div class="dm-bar-label" style="width:60px;flex-shrink:0;">${label === "0" ? "Direct" : label === "1" ? "1 relance" : label === "2" ? "2 relances" : label === "3" ? "3 relances" : "4+ relances"}</div>
      <div class="dm-bar-wrap">
        <div class="dm-bar-bg">
          <div class="dm-bar-fill" style="width:${Math.round((count/maxDistrib)*100)}%;background:var(--purple)"></div>
          <span class="dm-bar-count">${count}</span>
        </div>
      </div>
      <div class="dm-bar-info">${data.total_tracked > 0 ? Math.round(count/data.total_tracked*100) + "%" : "0%"}</div>
    </div>
  `).join("");
}

// ── Tab switch ───────────────────────────────────────────────────────────────

window.switchPerfTab = function(tab) {
  document.querySelectorAll(".perf-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".perf-panel").forEach(p => p.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  document.getElementById(`panel-${tab}`).classList.add("active");
};

window.initStats = async function() {
  await Promise.all([loadDM(), loadComptes(), loadNiches(), loadTendances(), loadProfils(), loadTiming()]);
};
