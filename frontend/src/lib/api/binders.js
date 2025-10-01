const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:12343/api';

function getAccountId() {
  if (typeof window === 'undefined') return '1';
  const stored = window.localStorage.getItem('accountId');
  if (stored) return stored;

  const userData = window.localStorage.getItem('userData');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      if (parsed && parsed.id) {
        return String(parsed.id);
      }
    } catch (err) {
      // ignore parsing errors, fall back to default
    }
  }

  return '1';
}

async function request(path, options = {}) {
  const accountId = getAccountId();
  const headers = { ...(options.headers || {}), 'X-Account-Id': accountId };
  const init = { ...options, headers };

  if (options.body && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, init);

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    // ignore JSON parse errors; handled below
  }

  if (!response.ok || !payload || payload.ok !== true) {
    const message = payload && payload.error ? payload.error : 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload.data;
}

export function getBinderCards(binderId) {
  return request(`/binders/${binderId}/cards`, { method: 'GET' });
}

export function getBinderCard(binderId, cardId) {
  return request(`/binders/${binderId}/cards/${cardId}`, { method: 'GET' });
}

export function addCard(binderId, body) {
  return request(`/binders/${binderId}/cards`, { method: 'POST', body });
}

export function changeQty(binderId, cardId, delta) {
  return request(`/binders/${binderId}/cards/${cardId}`, {
    method: 'PATCH',
    body: { delta },
  });
}
