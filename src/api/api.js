const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('token') || '';
}

function setToken(token) {
  if (!token) localStorage.removeItem('token');
  else localStorage.setItem('token', token);
}

function parseJwt(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (_e) {
    const err = new Error('NETWORK_ERROR');
    err.status = 0;
    throw err;
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (res.status === 401) {
    const err = new Error('UNAUTHORIZED');
    err.status = 401;
    throw err;
  }
  if (res.status === 403) {
    const err = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }
  if (!res.ok) {
    const err = new Error('REQUEST_FAILED');
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json;
}

function toApiConfidence(ui) {
  const v = String(ui || '').trim().toUpperCase();
  if (v === 'LOW') return 'LOW';
  if (v === 'MEDIUM') return 'MEDIUM';
  if (v === 'HIGH') return 'HIGH';
  return '';
}

function fromApiConfidence(api) {
  if (api === 'LOW') return 'Low';
  if (api === 'MEDIUM') return 'Medium';
  if (api === 'HIGH') return 'High';
  return '';
}

export const api = {
  getToken,
  setToken,
  parseJwt,
  request,
  toApiConfidence,
  fromApiConfidence,
};


