const API = "https://venatus-api.onrender.com";

export async function getStats()          { return fetch(`${API}/stats`).then(r => r.json()); }
export async function getGoal()           { return fetch(`${API}/goal`).then(r => r.json()); }
export async function getRelances()       { return fetch(`${API}/leads/relances`).then(r => r.json()); }
export async function getStatsDM()        { return fetch(`${API}/stats/dm`).then(r => r.json()); }
export async function getStatsComptes()   { return fetch(`${API}/stats/comptes`).then(r => r.json()); }
export async function getStatsNiches()    { return fetch(`${API}/stats/niches`).then(r => r.json()); }
export async function getStatsTendances() { return fetch(`${API}/stats/tendances`).then(r => r.json()); }
export async function getStatsProfils()   { return fetch(`${API}/stats/profils`).then(r => r.json()); }

export async function getLeads(params = {}) {
  return fetch(`${API}/leads?${new URLSearchParams(params)}`).then(r => r.json());
}
export async function getLead(id) {
  return fetch(`${API}/leads/${id}`).then(r => r.json());
}
export async function updateLead(id, data) {
  return fetch(`${API}/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(r => r.json());
}
export async function addNote(id, note) {
  return fetch(`${API}/leads/${id}/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note })
  }).then(r => r.json());
}
