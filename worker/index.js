// Domači proračun — Cloudflare Worker sync backend
// Deploy: wrangler deploy  (see wrangler.toml)
// Env vars to set in Cloudflare dashboard: SYNC_TOKEN (any random string, e.g. openssl rand -hex 32)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function auth(request, env) {
  const h = request.headers.get('Authorization') || '';
  return h === `Bearer ${env.SYNC_TOKEN}`;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (!auth(request, env)) return json({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);

    // GET /sync — pull encrypted payload
    if (request.method === 'GET' && url.pathname === '/sync') {
      const payload = await env.BUDGET_KV.get('payload', 'json');
      return json(payload);
    }

    // POST /sync — push encrypted payload (last-write-wins)
    if (request.method === 'POST' && url.pathname === '/sync') {
      const body = await request.json();
      if (!body?.iv || !body?.data) return json({ error: 'Invalid payload' }, 400);
      await env.BUDGET_KV.put('payload', JSON.stringify(body));
      return json({ ok: true, version: body.version });
    }

    // DELETE /sync — wipe (emergency reset)
    if (request.method === 'DELETE' && url.pathname === '/sync') {
      await env.BUDGET_KV.delete('payload');
      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);
  },
};
