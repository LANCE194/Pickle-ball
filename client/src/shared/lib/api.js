// API client. The access token lives in sessionStorage so every browser TAB has its own session (rule D).
const BASE = import.meta.env.VITE_API_URL || '';
const KEY = 'dn_token';
export const apiUrl = path => `${BASE}${path}`;
export const getToken = () => sessionStorage.getItem(KEY);
export const setToken = t => (t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY));
export class ApiError extends Error {
  constructor(status, body) { super(body?.error || 'Something went wrong on our side. Please try again.'); this.status = status; this.code = body?.code; this.fields = body?.fields; this.alternatives = body?.alternatives; this.needs = body?.needs; this.dependents = body?.dependents; }
}
const FRIENDLY = { 401: 'Please log in to continue.', 403: 'You do not have access to this page. Please ask the front desk.', 404: 'We could not find that.', 429: 'Too many tries. Please wait a moment.' };
let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };
async function request(method, path, { body, query, form, raw } = {}) {
  const qs = query ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString() : '';
  const headers = {}; const t = getToken(); if (t) headers.Authorization = `Bearer ${t}`;
  let payload; if (form) payload = form; else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(apiUrl(`${path}${qs}`), { method, headers, body: payload }); }
  catch { throw new ApiError(0, { error: 'You seem to be offline. Check your connection and try again.', code: 'OFFLINE' }); }
  if (raw && res.ok) return res;
  let data = null; try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    if (res.status === 401 && t) onUnauthorized();
    if (data?.code === 'PASSWORD_CHANGE_REQUIRED') window.dispatchEvent(new Event('dn:must-change-password'));
    throw new ApiError(res.status, { ...data, error: data?.error && res.status < 500 ? data.error : (FRIENDLY[res.status] || data?.error) });
  }
  return data;
}
export const api = {
  get: (p, query) => request('GET', p, { query }),
  post: (p, body) => request('POST', p, { body: body ?? {} }),
  patch: (p, body) => request('PATCH', p, { body: body ?? {} }),
  put: (p, body) => request('PUT', p, { body: body ?? {} }),
  del: p => request('DELETE', p),
  upload: (p, form, method = 'POST') => request(method, p, { form }),
  /** Download a file with the tab's token (exports, PDFs) */
  download: async (p, name) => { const res = await request('GET', p, { raw: true }); const blob = await res.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); },
  /** Image URL for private files (needs the token, so fetch as blob) */
  blobUrl: async p => { const res = await request('GET', p, { raw: true }); return URL.createObjectURL(await res.blob()); },
};
