import { getComptes, getLeads } from "./api-module.js";

window.initComptes = async function() {
  const el   = document.getElementById("comptes-grid");
  const data = await getComptes();
  const comptes = data.comptes || [];

  if (!comptes.length) {
    el.innerHTML = '<div class="empty">Aucun compte configuré</div>';
    return;
  }

  const counts = await Promise.all(
    comptes.map(c => getLeads({ compte_ig: c, limit: 1 }).then(d => d.total))
  );

  el.innerHTML = comptes.map((c, i) => `
    <div class="niche-item" onclick="window.location='leads.html?compte_ig=${encodeURIComponent(c)}'">
      <div class="niche-label">📱 ${c}</div>
      <div class="niche-count">${counts[i]}</div>
    </div>
  `).join("");
};
