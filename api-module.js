const API = "https://venatus-api.onrender.com";

export async function getStats() {
  return fetch(`${API}/stats`).then(r => r.json());
}

export async function getGoal() {
  return fetch(`${API}/goal`).then(r => r.json());
}

export async function getLeads(params = {}) {
  const q = new URLSearchParams(params).toString();
  return fetch(`${API}/leads?${q}`).then(r => r.json());
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

export async function getRelances() {
  return fetch(`${API}/leads/relances`).then(r => r.json());
}

export async function getStatsDM() {
  return fetch(`${API}/stats/dm`).then(r => r.json());
}
