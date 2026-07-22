const API = "https://venatus-api.onrender.com";

async function getStats() {
  const res = await fetch(`${API}/stats`);
  return res.json();
}

async function getLeads(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/leads?${q}`);
  return res.json();
}

async function getLead(id) {
  const res = await fetch(`${API}/leads/${id}`);
  return res.json();
}

async function updateLead(id, data) {
  const res = await fetch(`${API}/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function addNote(id, note) {
  const res = await fetch(`${API}/leads/${id}/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note })
  });
  return res.json();
}

async function getRelances() {
  const res = await fetch(`${API}/leads/relances`);
  return res.json();
}
