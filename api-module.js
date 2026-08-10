import { auth } from "./firebase-auth.js";

const API = "https://venatus-api.onrender.com";

async function authFetch(path, options = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API}${path}`, { ...options, headers });
}

export async function getStats()            { return authFetch(`/stats`).then(r => r.json()); }
export async function getGoal()             { return authFetch(`/goal`).then(r => r.json()); }
export async function getRelances()         { return authFetch(`/leads/relances`).then(r => r.json()); }
export async function getStatsDM()          { return authFetch(`/stats/dm`).then(r => r.json()); }
export async function getStatsComptes()     { return authFetch(`/stats/comptes`).then(r => r.json()); }
export async function getStatsNiches()      { return authFetch(`/stats/niches`).then(r => r.json()); }
export async function getStatsTendances()   { return authFetch(`/stats/tendances`).then(r => r.json()); }
export async function getStatsProfils()     { return authFetch(`/stats/profils`).then(r => r.json()); }
export async function getStatsTiming()      { return authFetch(`/stats/timing`).then(r => r.json()); }
export async function getStatsSources()     { return authFetch(`/stats/sources`).then(r => r.json()); }
export async function getStatsCroise()      { return authFetch(`/stats/croise`).then(r => r.json()); }

export async function getLeads(params = {}) {
  return authFetch(`/leads?${new URLSearchParams(params)}`).then(r => r.json());
}
export async function getLead(id) {
  return authFetch(`/leads/${id}`).then(r => r.json());
}
export async function updateLead(id, data) {
  return authFetch(`/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(r => r.json());
}
export async function addNote(id, note) {
  return authFetch(`/leads/${id}/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note })
  }).then(r => r.json());
}
export async function incrementRelance(id) {
  return authFetch(`/leads/${id}/relance`, { method: "POST" }).then(r => r.json());
}
export async function getMines(statut = "")    { return authFetch(`/mines${statut ? `?statut=${statut}` : ""}`).then(r => r.json()); }
export async function getMinesStats()          { return authFetch(`/mines/stats`).then(r => r.json()); }
export async function addMine(data)            { return authFetch(`/mines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()); }
export async function updateMine(id, data)     { return authFetch(`/mines/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()); }
export async function deleteMine(id)           { return authFetch(`/mines/${id}`, { method: "DELETE" }).then(r => r.json()); }
