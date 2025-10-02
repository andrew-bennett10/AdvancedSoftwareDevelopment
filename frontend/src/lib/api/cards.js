const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:12343/api';

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const init = { ...options, headers };

  if (options.body && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload || payload.ok !== true) {
    const error = new Error((payload && payload.error) || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function searchCards(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.append(key, value);
    }
  });

  const qs = query.toString();
  const path = `/cards${qs ? `?${qs}` : ''}`;
  return request(path, { method: 'GET' });
}
