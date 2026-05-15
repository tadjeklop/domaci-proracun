// AES-GCM encryption + Cloudflare Worker sync
// Data never leaves the browser unencrypted.

const ENC = new TextEncoder();
const DEC = new TextDecoder();
const SALT = ENC.encode('domaci-proracun-v1');

async function deriveKey(password) {
  const raw = await crypto.subtle.importKey('raw', ENC.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: 100_000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function unb64(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }

export async function encryptPayload(data, password) {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, ENC.encode(JSON.stringify(data)));
  return { iv: b64(iv), data: b64(ct), version: Date.now() };
}

export async function decryptPayload(payload, password) {
  const key = await deriveKey(password);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(payload.iv) },
    key,
    unb64(payload.data)
  );
  return JSON.parse(DEC.decode(pt));
}

export async function pushToCloud(allData, url, token, password) {
  const payload = await encryptPayload(allData, password);
  const res = await fetch(`${url}/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
  return payload.version;
}

export async function pullFromCloud(url, token, password) {
  const res = await fetch(`${url}/sync`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
  const payload = await res.json();
  if (!payload?.iv) return null;
  return decryptPayload(payload, password);
}

// Keys to include in sync (financial data only, no UI prefs)
export const SYNC_KEYS = [
  'dp_data', 'dp_goals', 'dp_cry', 'dp_wishes', 'dp_savdata',
  'dp_profiles', 'dp_activeprofid', 'dp_subvis', 'dp_subren',
  'dp_customsubs', 'dp_customcatgroups', 'dp_suborder', 'dp_subalerts',
  'dp_it', 'dp_ku', 'dp_occasions', 'dp_billdays', 'dp_simman',
  'dp_simcats', 'dp_simret', 'dp_siminit', 'dp_simev',
  'dp_adminconf', 'dp_accounts', 'dp_audit',
];

export function collectSyncData() {
  const snap = {};
  SYNC_KEYS.forEach(k => { try { const v = localStorage.getItem(k); if (v) snap[k] = JSON.parse(v); } catch {} });
  return snap;
}

export function applySyncData(snap) {
  SYNC_KEYS.forEach(k => {
    if (snap[k] != null) localStorage.setItem(k, JSON.stringify(snap[k]));
  });
}
