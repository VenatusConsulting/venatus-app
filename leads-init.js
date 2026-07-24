import { getLeads, getLead, updateLead, addNote, incrementRelance } from "./api-module.js";

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

const COMPTES_IG = ["@Popsy.Mel", "@Ceo.Maxime"];

let page = 0, total = 0, currentId = null, debounce = null;
const LIMIT = 20;

function getRetard(dateRelance) {
  if (!dateRelance) return null;
  const [d, m, y] = dateRelance.split("/").map(Number);
  const relance   = new Date(y, m - 1, d);
  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - relance) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function extractHeure(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(" ");
  return parts.length > 1 ? parts[1] : null;
}

function getFilters() {
  return {
    statut: document.getElementById("filter-statut").value,
    niche:  document.getElementById("filter-niche").value,
    search: document.getElementById("search").value.trim(),
    limit:  LIMIT,
    skip:   page * LIMIT,
  };
}

async function loadLeads() {
  document.getElementById("leads-list").innerHTML = '<div class="loading">Chargement...</div>';
  const data = await getLeads(getFilters());
  total = data.total;
  document.getElementById("leads-total").textContent = total + " leads";
  renderLeads(data.leads);
  updatePagination();
}

function renderLeads(list) {
  const el = document.getElementById("leads-list");
  if (!list.length) { el.innerHTML = '<div class="empty">Aucun lead trouvé</div>'; return; }
  el.innerHTML = list.map(lead => {
    const s      = STATUTS[lead.statut] || STATUTS.nouveau;
    const n      = NICHES[lead.niche] || "";
    const retard = getRetard(lead.date_relance);
    return `
      <div class="lead-row" onclick="window._openLeadL('${lead._id}')">
        <div class="lead-main">
          <div class="lead-pseudo">${lead.pseudo}</div>
          <div class="lead-meta">
            ${n ? `<span class="tag">${n}</span>` : ""}
            ${lead.abonnes   ? `<span class="tag">👥 ${lead.abonnes}</span>` : ""}
            ${lead.compte_ig ? `<span class="tag">📱 ${lead.compte_ig}</span>` : ""}
            ${lead.nb_relances > 0 ? `<span class="tag">🔁 ${lead.nb_relances} relance${lead.nb_relances > 1 ? "s" : ""}</span>` : ""}
            ${retard
              ? `<span class="tag retard-tag">⚠️ ${retard}j de retard</span>`
              : lead.date_relance ? `<span class="tag">⏰ ${lead.date_relance}</span>` : ""}
          </div>
        </div>
        <div class="lead-statut" style="color:${s.color}">${s.label}</div>
      </div>
    `;
  }).join("");
}

function updatePagination() {
  const pages = Math.ceil(total / LIMIT);
  document.getElementById("page-info").textContent = `Page ${page + 1} / ${pages || 1}`;
  document.getElementById("prev-btn").disabled     = page === 0;
  document.getElementById("next-btn").disabled     = (page + 1) * LIMIT >= total;
}

function removePopup() {
  const p = document.getElementById("action-popup");
  if (p) p.remove();
}

function showComptePopup(onConfirm) {
  removePopup();
  const popup = document.createElement("div");
  popup.id = "action-popup";
  popup.style.cssText = `
    position:fixed;inset:0;z-index:2000;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);
  `;
  popup.innerHTML = `
    <div style="background:#0d0d1a;border:1px solid #2a2a45;border-radius:16px;padding:28px;width:340px;max-width:90%;">
      <div style="font-size:16px;font-weight:700;color:#e0e0ff;margin-bottom:4px;">📱 Depuis quel compte ?</div>
      <div style="font-size:12px;color:#555;margin-bottom:20px;">Choisis le compte Instagram utilisé pour ce DM</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        ${COMPTES_IG.map(c => `
          <button data-compte="${c}" class="popup-compte-btn" style="
            background:#0f0f1e;border:1px solid #2a2a45;border-radius:8px;
            padding:10px 16px;color:#e0e0ff;font-size:14px;font-weight:600;
            cursor:pointer;text-align:left;transition:all 0.2s;
          ">${c}</button>
        `).join("")}
        <button data-compte="__autre__" class="popup-compte-btn" style="
          background:#0f0f1e;border:1px solid #2a2a45;border-radius:8px;
          padding:10px 16px;color:#555;font-size:13px;cursor:pointer;text-align:left;
        ">➕ Autre compte...</button>
      </div>
      <div id="autre-wrap" style="display:none;margin-bottom:12px;">
        <input type="text" id="autre-input" placeholder="@NouveauCompte" style="
          width:100%;background:#0f0f1e;border:1px solid #2a2a45;border-radius:8px;
          padding:8px 12px;color:#e0e0ff;font-size:13px;outline:none;box-sizing:border-box;
        ">
      </div>
      <div style="display:flex;gap:8px;">
        <button id="popup-cancel" style="
          flex:1;background:#0f0f1e;border:1px solid #2a2a45;border-radius:8px;
          padding:9px;color:#555;font-size:13px;cursor:pointer;
        ">Annuler</button>
        <button id="popup-confirm" style="
          flex:2;background:linear-gradient(135deg,#667eea,#764ba2);border:none;
          border-radius:8px;padding:9px;color:white;font-size:13px;font-weight:700;cursor:pointer;
        ">Confirmer →</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  let selected = null;

  popup.querySelectorAll(".popup-compte-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      popup.querySelectorAll(".popup-compte-btn").forEach(b => {
        b.style.borderColor = "#2a2a45";
        b.style.color = b.dataset.compte === "__autre__" ? "#555" : "#e0e0ff";
      });
      if (btn.dataset.compte === "__autre__") {
        document.getElementById("autre-wrap").style.display = "block";
        selected = "__autre__";
      } else {
        document.getElementById("autre-wrap").style.display = "none";
        selected = btn.dataset.compte;
      }
      btn.style.borderColor = "#667eea";
      btn.style.color = "#667eea";
    });
  });

  document.getElementById("popup-cancel").addEventListener("click", removePopup);
  document.getElementById("popup-confirm").addEventListener("click", () => {
    let compte = selected;
    if (compte === "__autre__") {
      compte = document.getElementById("autre-input").value.trim();
      if (!compte) return;
      if (!compte.startsWith("@")) compte = "@" + compte;
      if (!COMPTES_IG.includes(compte)) COMPTES_IG.push(compte);
    }
    if (!compte) return;
    removePopup();
    onConfirm(compte);
  });
}

function showHeureReponsePopup(onConfirm) {
  removePopup();
  const now    = new Date();
  const hh     = String(now.getHours()).padStart(2, "0");
  const mm     = String(now.getMinutes()).padStart(2, "0");
  const defaut = `${hh}:${mm}`;

  const popup = document.createElement("div");
  popup.id = "action-popup";
  popup.style.cssText = `
    position:fixed;inset:0;z-index:2000;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);
  `;
  popup.innerHTML = `
    <div style="
      background:#0d0d1a;border:1px solid #2a2a45;border-radius:16px;
      padding:28px;width:340px;max-width:90%;
    ">
      <div style="font-size:16px;font-weight:700;color:#e0e0ff;margin-bottom:4px;">💬 Elle a répondu !</div>
      <div style="font-size:12px;color:#555;margin-bottom:24px;">À quelle heure elle t'a répondu sur Instagram ?</div>

      <div style="
        background:#0f0f1e;border:1px solid #2a2a45;border-radius:12px;
        padding:20px;text-align:center;margin-bottom:8px;
      ">
        <div style="font-size:11px;color:#555;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Heure de réponse</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
          <select id="heure-h" style="
            background:#1a1a2e;border:1px solid #667eea;border-radius:8px;
            padding:10px 14px;color:#e0e0ff;font-size:24px;font-weight:700;
            outline:none;cursor:pointer;-webkit-appearance:none;text-align:center;
          ">
            ${Array.from({length:24},(_,i)=>`<option value="${String(i).padStart(2,'0')}" ${String(i).padStart(2,'0')===hh?'selected':''}>${String(i).padStart(2,'0')}</option>`).join("")}
          </select>
          <span style="font-size:28px;font-weight:700;color:#667eea;">:</span>
          <select id="heure-m" style="
            background:#1a1a2e;border:1px solid #667eea;border-radius:8px;
            padding:10px 14px;color:#e0e0ff;font-size:24px;font-weight:700;
            outline:none;cursor:pointer;-webkit-appearance:none;text-align:center;
          ">
            ${Array.from({length:60},(_,i)=>`<option value="${String(i).padStart(2,'0')}" ${String(i).padStart(2,'0')===mm?'selected':''}>${String(i).padStart(2,'0')}</option>`).join("")}
          </select>
        </div>
      </div>

      <div style="font-size:11px;color:#444;text-align:center;margin-bottom:20px;">
        Pré-rempli avec l'heure actuelle (${defaut}) — ajuste si besoin
      </div>

      <div style="display:flex;gap:8px;">
        <button id="popup-cancel" style="
          flex:1;background:#0f0f1e;border:1px solid #2a2a45;border-radius:8px;
          padding:11px;color:#555;font-size:13px;cursor:pointer;
        ">Annuler</button>
        <button id="popup-confirm" style="
          flex:2;background:linear-gradient(135deg,#29b6f6,#0288d1);border:none;
          border-radius:8px;padding:11px;color:white;font-size:13px;font-weight:700;cursor:pointer;
        ">✅ Confirmer en discussion</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById("popup-cancel").addEventListener("click", removePopup);
  document.getElementById("popup-confirm").addEventListener("click", () => {
    const h = document.getElementById("heure-h").value;
    const m = document.getElementById("heure-m").value;
    removePopup();
    onConfirm(`${h}:${m}`);
  });
}

async function openLead(id) {
  currentId    = id;
  const lead   = await getLead(id);
  const s      = STATUTS[lead.statut] || STATUTS.nouveau;
  const retard = getRetard(lead.date_relance);
  const heureDM = lead.heure_dm || extractHeure(lead.date_contact);

  const comptesBase = [...COMPTES_IG];
  if (lead.compte_ig && !comptesBase.includes(lead.compte_ig)) {
    comptesBase.push(lead.compte_ig);
  }

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
      <div class="detail-row">
        <span class="detail-label">Ajouté le</span>
        <span>${lead.date_ajout || "—"}</span>
      </div>
      ${lead.date_contact ? `
        <div class="detail-row">
          <span class="detail-label">Contacté le</span>
          <span>${lead.date_contact}${heureDM ? ` <span style="color:var(--text3);font-size:11px;">🕐 ${heureDM}</span>` : ""}</span>
        </div>` : ""}
      ${lead.heure_reponse ? `
        <div class="detail-row">
          <span class="detail-label">Heure de réponse</span>
          <span style="color:var(--green)">💬 ${lead.heure_reponse}</span>
        </div>` : ""}
      ${lead.dm_utilise ? `
        <div class="detail-row">
          <span class="detail-label">DM utilisé</span>
          <span>${lead.dm_utilise.toUpperCase()}</span>
        </div>` : ""}
      <div class="detail-row">
        <span class="detail-label">Compte IG</span>
        <div style="display:flex;gap:6px;align-items:center;">
          <select id="compte-ig-select"
            style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 8px;color:var(--text);font-size:12px;outline:none;cursor:pointer;">
            <option value="">— Choisir —</option>
            ${comptesBase.map(c => `<option value="${c}" ${lead.compte_ig === c ? "selected" : ""}>${c}</option>`).join("")}
            <option value="__nouveau__">➕ Nouveau compte...</option>
          </select>
          <button id="save-compte-ig"
            style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 10px;color:var(--text2);font-size:12px;cursor:pointer;">
            Sauver
          </button>
        </div>
      </div>
      <div id="nouveau-compte-wrap" style="display:none;margin-top:6px;">
        <input type="text" id="nouveau-compte-input" placeholder="@NouveauCompte"
          style="width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:6px 10px;color:var(--text);font-size:12px;outline:none;">
      </div>
      ${lead.date_relance ? `
        <div class="detail-row">
          <span class="detail-label">Relance</span>
          <span ${retard ? 'style="color:#ef5350;font-weight:600;"' : ""}>
            ⏰ ${lead.date_relance}
            ${retard ? `<span class="retard-inline">⚠️ ${retard}j de retard</span>` : ""}
          </span>
        </div>` : ""}
      ${lead.nb_relances > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Nb relances</span>
          <span>🔁 ${lead.nb_relances} relance${lead.nb_relances > 1 ? "s" : ""}</span>
        </div>` : ""}
      ${lead.notes ? `
        <div class="detail-row notes">
          <span class="detail-label">Notes</span>
          <span>${lead.notes}</span>
        </div>` : ""}
    </div>

    <div class="modal-section">
      <div class="detail-label">Changer le statut</div>
      <div class="statut-buttons">
        ${Object.entries(STATUTS).map(([key, val]) => `
          <button class="btn-statut ${lead.statut === key ? "active" : ""}" style="--color:${val.color}"
            data-statut="${key}">${val.label}</button>
        `).join("")}
      </div>
    </div>

    <div class="modal-section">
      <div class="detail-label">Ajouter une note</div>
      <div class="note-input-wrap">
        <input type="text" id="note-input" placeholder="Ta note..." class="note-input">
        <button id="save-note-btn" class="btn-primary">Ajouter</button>
      </div>
    </div>
  `;

  document.getElementById("compte-ig-select").addEventListener("change", (e) => {
    document.getElementById("nouveau-compte-wrap").style.display =
      e.target.value === "__nouveau__" ? "block" : "none";
  });

  document.getElementById("save-compte-ig").addEventListener("click", async () => {
    const select = document.getElementById("compte-ig-select");
    let val = select.value;
    if (val === "__nouveau__") {
      val = document.getElementById("nouveau-compte-input")?.value.trim();
      if (!val) return;
      if (!val.startsWith("@")) val = "@" + val;
    }
    if (!val) return;
    await updateLead(currentId, { compte_ig: val });
    const btn = document.getElementById("save-compte-ig");
    if (btn) {
      btn.textContent = "✅";
      btn.style.color = "var(--green)";
      setTimeout(() => openLead(currentId), 1200);
    }
  });

  document.querySelectorAll(".btn-statut[data-statut]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const statut = btn.dataset.statut;
      if (statut === "contacte") {
        showComptePopup(async (compte) => {
          await updateLead(currentId, { statut, compte_ig: compte });
          window.closeModal();
          loadLeads();
        });
      } else if (statut === "en_discussion") {
        showHeureReponsePopup(async (heure) => {
          await updateLead(currentId, { statut, heure_reponse: heure });
          window.closeModal();
          loadLeads();
        });
      } else {
        await updateLead(currentId, { statut });
        window.closeModal();
        loadLeads();
      }
    });
  });

  document.getElementById("save-note-btn").addEventListener("click", async () => {
    const note = document.getElementById("note-input").value.trim();
    if (!note) return;
    await addNote(currentId, note);
    openLead(currentId);
  });
}

window._openLeadL = openLead;

window.closeModal = () => {
  document.getElementById("modal").classList.add("hidden");
  removePopup();
  currentId = null;
};

window.initLeads = function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("statut")) document.getElementById("filter-statut").value = params.get("statut");
  if (params.get("niche"))  document.getElementById("filter-niche").value  = params.get("niche");

  document.getElementById("search").addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { page = 0; loadLeads(); }, 400);
  });
  document.getElementById("filter-statut").addEventListener("change", () => { page = 0; loadLeads(); });
  document.getElementById("filter-niche").addEventListener("change",  () => { page = 0; loadLeads(); });
  document.getElementById("prev-btn").addEventListener("click", () => { page--; loadLeads(); });
  document.getElementById("next-btn").addEventListener("click", () => { page++; loadLeads(); });

  loadLeads();
};
