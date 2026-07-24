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

const DM_TEMPLATES = {
  dm1: { label: "DM 1 — Compliment physique", text: "omgg you are so pretty girl! 💗",              color: "#667eea" },
  dm2: { label: "DM 2 — Girl energy",          text: "idk why but you just have THAT girl energy 💅✨", color: "#f59e0b" },
  dm3: { label: "DM 3 — Feed + question",      text: "I love your feed 😍 how long have you been posting?", color: "#10b981" },
  dm4: { label: "DM 4 — Underrated",           text: "ok but why are you so underrated?? 👀",        color: "#ec4899" },
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

// ── Popup choix compte IG ────────────────────────────────────────────────────

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
        ">Suivant →</button>
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

// ── Popup choix DM ───────────────────────────────────────────────────────────

function showDMPopup(pseudo, onConfirm) {
  removePopup();
  const popup = document.createElement("div");
  popup.id = "action-popup";
  popup.style.cssText = `
    position:fixed;inset:0;z-index:2000;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);
  `;
  popup.innerHTML = `
    <div style="background:#0d0d1a;border:1px solid #2a2a45;border-radius:16px;padding:28px;width:380px;max-width:90%;">
      <div style="font-size:16px;font-weight:700;color:#e0e0ff;margin-bottom:4px;">💬 Quel DM envoies-tu ?</div>
      <div style="font-size:12px;color:#555;margin-bottom:20px;">Choisis le template — il sera copié automatiquement</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
        ${Object.entries(DM_TEMPLATES).map(([key, dm]) => `
          <button data-dm="${key}" class="popup-dm-btn" style="
            background:#0f0f1e;border:1px solid #2a2a45;border-radius:10px;
            padding:12px 16px;color:#e0e0ff;font-size:13px;
            cursor:pointer;text-align:left;transition:all 0.2s;
          ">
            <div style="font-weight:600;color:${dm.color};margin-bottom:4px;">${dm.label}</div>
            <div style="font-size:12px;color:#555;font-style:italic;">"${dm.text}"</div>
          </button>
        `).join("")}
      </div>
      <div id="dm-preview" style="
        display:none;
        background:#0f0f1e;border:1px solid #2a2a45;border-radius:10px;
        padding:14px 16px;margin-bottom:16px;
      ">
        <div style="font-size:11px;color:#555;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">📋 Message à copier</div>
        <div id="dm-preview-text" style="font-size:15px;color:#e0e0ff;font-weight:500;"></div>
        <button id="copy-dm-btn" style="
          margin-top:10px;background:rgba(102,126,234,0.15);border:1px solid rgba(102,126,234,0.4);
          border-radius:6px;padding:6px 14px;color:#667eea;font-size:12px;font-weight:600;cursor:pointer;
        ">📋 Copier</button>
      </div>
      <div style="display:flex;gap:8px;">
        <button id="popup-cancel" style="
          flex:1;background:#0f0f1e;border:1px solid #2a2a45;border-radius:8px;
          padding:11px;color:#555;font-size:13px;cursor:pointer;
        ">Annuler</button>
        <button id="popup-confirm" style="
          flex:2;background:linear-gradient(135deg,#667eea,#764ba2);border:none;
          border-radius:8px;padding:11px;color:white;font-size:13px;font-weight:700;
          cursor:pointer;opacity:0.4;pointer-events:none;
        " disabled>✅ Confirmer contacté</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  let selectedDM = null;

  popup.querySelectorAll(".popup-dm-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      popup.querySelectorAll(".popup-dm-btn").forEach(b => {
        b.style.borderColor = "#2a2a45";
        b.style.background  = "#0f0f1e";
      });
      btn.style.borderColor = DM_TEMPLATES[btn.dataset.dm].color;
      btn.style.background  = `${DM_TEMPLATES[btn.dataset.dm].color}18`;
      selectedDM = btn.dataset.dm;

      // Affiche preview
      const preview = document.getElementById("dm-preview");
      const previewText = document.getElementById("dm-preview-text");
      preview.style.display    = "block";
      previewText.textContent  = DM_TEMPLATES[selectedDM].text;

      // Active le bouton confirmer
      const confirm = document.getElementById("popup-confirm");
      confirm.disabled             = false;
      confirm.style.opacity        = "1";
      confirm.style.pointerEvents  = "auto";
    });
  });

  document.getElementById("copy-dm-btn")?.addEventListener("click", () => {
    if (!selectedDM) return;
    navigator.clipboard.writeText(DM_TEMPLATES[selectedDM].text).then(() => {
      const btn = document.getElementById("copy-dm-btn");
      if (btn) { btn.textContent = "✅ Copié !"; setTimeout(() => { btn.textContent = "📋 Copier"; }, 1500); }
    });
  });

  document.getElementById("popup-cancel").addEventListener("click", removePopup);
  document.getElementById("popup-confirm").addEventListener("click", () => {
    if (!selectedDM) return;
    removePopup();
    onConfirm(selectedDM);
  });
}

// ── Popup heure de réponse ───────────────────────────────────────────────────

function showHeureReponsePopup(onConfirm) {
  removePopup();
  const now    = new Date();
  const hh     = String(now.getHours()).padStart(2, "0");
  const mm     = String(now.getMinutes()).padStart(2, "0");

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
        <div style="font-size:11px;color:#555;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px;">Heure de réponse</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
          <input type="number" id="input-hh" value="${hh}" min="0" max="23" style="
            background:#1a1a2e;border:1px solid #667eea;border-radius:8px;
            padding:10px 0;color:#e0e0ff;font-size:32px;font-weight:700;
            text-align:center;outline:none;width:72px;-moz-appearance:textfield;
          ">
          <span style="font-size:32px;font-weight:700;color:#667eea;line-height:1;">:</span>
          <input type="number" id="input-mm" value="${mm}" min="0" max="59" style="
            background:#1a1a2e;border:1px solid #667eea;border-radius:8px;
            padding:10px 0;color:#e0e0ff;font-size:32px;font-weight:700;
            text-align:center;outline:none;width:72px;-moz-appearance:textfield;
          ">
        </div>
      </div>
      <div style="font-size:11px;color:#444;text-align:center;margin-bottom:20px;">
        Pré-rempli avec l'heure actuelle — modifie si besoin
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

  const inputHH = document.getElementById("input-hh");
  const inputMM = document.getElementById("input-mm");

  inputHH.addEventListener("input", () => {
    let v = parseInt(inputHH.value);
    if (isNaN(v)) return;
    if (v > 23) inputHH.value = 23;
    if (v < 0)  inputHH.value = 0;
  });
  inputMM.addEventListener("input", () => {
    let v = parseInt(inputMM.value);
    if (isNaN(v)) return;
    if (v > 59) inputMM.value = 59;
    if (v < 0)  inputMM.value = 0;
  });
  inputHH.addEventListener("keyup", (e) => {
    if (inputHH.value.length >= 2 && e.key !== "Backspace") {
      inputMM.focus(); inputMM.select();
    }
  });

  document.getElementById("popup-cancel").addEventListener("click", removePopup);
  document.getElementById("popup-confirm").addEventListener("click", () => {
    const h = String(parseInt(inputHH.value) || 0).padStart(2, "0");
    const m = String(parseInt(inputMM.value) || 0).padStart(2, "0");
    removePopup();
    onConfirm(`${h}:${m}`);
  });
}

// ── Modal lead ───────────────────────────────────────────────────────────────

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
        <span
