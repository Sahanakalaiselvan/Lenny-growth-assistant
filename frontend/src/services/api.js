const API_BASE = '/api';

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions/`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return await res.json();
}

export async function createSession(title = "New Growth Chat", provider = "ollama", model = "llama3.2") {
  const res = await fetch(`${API_BASE}/sessions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, llm_provider: provider, llm_model: model })
  });
  if (!res.ok) throw new Error('Failed to create session');
  return await res.json();
}

export async function getSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch session details');
  return await res.json();
}

export async function updateSession(sessionId, updates) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update session');
  return await res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete session');
  return await res.json();
}

export async function sendChatMessage({ sessionId, message, isShip30 = false, isArtifactRequest = false, provider = null, model = null }) {
  const res = await fetch(`${API_BASE}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      is_ship30: isShip30,
      is_artifact_request: isArtifactRequest,
      provider,
      model
    })
  });
  if (!res.ok) throw new Error('Failed to send chat message');
  return await res.json();
}

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/config/`);
  if (!res.ok) throw new Error('Failed to fetch system config');
  return await res.json();
}

export async function fetchArtifact(artifactId) {
  const res = await fetch(`${API_BASE}/artifacts/${artifactId}`);
  if (!res.ok) throw new Error('Failed to fetch artifact');
  return await res.json();
}

export async function saveApiKeys({ anthropicApiKey, openaiApiKey }) {
  const res = await fetch(`${API_BASE}/config/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anthropic_api_key: anthropicApiKey,
      openai_api_key: openaiApiKey
    })
  });
  if (!res.ok) throw new Error('Failed to save API keys');
  return await res.json();
}


