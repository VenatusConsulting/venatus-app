const DM_TEMPLATES = {
  dm1: { label: "DM 1 — Compliment physique", text: "omgg you are so pretty girl! 💗" },
  dm2: { label: "DM 2 — Girl energy",          text: "idk why but you just have THAT girl energy 💅✨" },
  dm3: { label: "DM 3 — Feed + question",      text: "I love your feed 😍 how long have you been posting?" },
  dm4: { label: "DM 4 — Underrated",           text: "ok but why are you so underrated?? 👀" },
};

const DM_COLORS = {
  dm1: "#667eea",
  dm2: "#f59e0b",
  dm3: "#10b981",
  dm4: "#ec4899",
};

async function loadStats() {
  const data = await fetch("https://venatus-api.onrender.com/stats/dm").then(r => r.json());

  // Meilleur DM
  let best = null;
  for (const [key, val] of Object.entries(data)) {
    if (!best || val.taux > data[best].taux) best = key;
  }

  if (best) {
    const b = data[best];
    document.getElementById("best-dm-card").innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="font-size:32px;">🏆</div>
        <div>
          <div style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Meilleur DM</div>
          <div style="font-size:18px;font-weight:700;color:${DM_COLORS[best]}">${DM_TEMPLATES[best].label}</div>
          <div style="font-size:13px;color:var(--text2);margin-top:4px;">"${DM_TEMPLATES[best].text}"</div>
          <div style="margin-top:8px;display:flex;gap:16px;">
            <span style="font-size:13px;color:var(--text2)">📨 <strong>${b.total}</strong> envoyés</span>
            <span style="font-size:13px;color:var(--green)">💬 <strong>${b.reponses}</strong> réponses</span>
            <span style="font-size:13px;color:#f59e0b">🔥 <strong>${b.taux}%</strong> taux</span>
          </div>
        </div>
      </div>
    `;
  }

  // Barres
  const maxTaux = Math.max(...Object.values(data).map(d => d.taux), 1);
  document.getElementById("dm-bars").innerHTML = Object.entries(data).map(([key, val]) => {
    const pct   = Math.round((val.taux / maxTaux) * 100);
    const color = DM_COLORS[key];
    return `
      <div class="dm-bar-row">
        <div class="dm-bar-label">${DM_TEMPLATES[key]?.label || key}</div>
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

  // Tableau
  const sorted = Object.entries(data).sort((a, b) => b[1].taux - a[1].taux);
  document.getElementById("dm-table").innerHTML = `
    <table class="dm-table">
      <thead>
        <tr>
          <th>DM</th>
          <th>Envoyés</th>
          <th>Réponses</th>
          <th>Signés</th>
          <th>Taux</th>
          <th>Classement</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(([key, val], i) => `
          <tr>
            <td style="color:${DM_COLORS[key]};font-weight:600;">${DM_TEMPLATES[key]?.label || key}</td>
            <td>${val.total}</td>
            <td>${val.reponses}</td>
            <td>${val.signes}</td>
            <td>
              <span class="taux-badge" style="color:${val.taux >= 30 ? 'var(--green)' : val.taux >= 15 ? 'var(--yellow)' : 'var(--text3)'}">
                ${val.taux}%
              </span>
            </td>
            <td>
              ${ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}` }
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  // Templates
  document.getElementById("dm-templates").innerHTML = Object.entries(DM_TEMPLATES).map(([key, val]) => {
    const d     = data[key] || { total: 0, reponses: 0, taux: 0 };
    const color = DM_COLORS[key];
    return `
      <div class="template-card">
        <div class="template-header">
          <span class="template-label" style="color:${color}">${val.label}</span>
          <span class="template-taux" style="color:${d.taux >= 30 ? 'var(--green)' : d.taux >= 15 ? 'var(--yellow)' : 'var(--text3)'}">
            ${d.taux}% réponses
          </span>
        </div>
        <div class="template-text">"${val.text}"</div>
        <div class="template-stats">
          <span>📨 ${d.total} envoyés</span>
          <span>💬 ${d.reponses} réponses</span>
          <span>✅ ${d.signes} signés</span>
        </div>
      </div>
    `;
  }).join("");
}

loadStats();
