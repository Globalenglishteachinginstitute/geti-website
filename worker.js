// GETI Certificate Sync — Cloudflare Worker
// Bind Cloudflare D1 to `DB` and configure encrypted secret `SECRET_VALUE`.
// The worker stores only request identifiers, timestamps, and status in D1.
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') {
      return Response.json({ ok: true, service: 'geti-certificate-sync' });
    }
    if (path !== '/webhook') return new Response('Not found', { status: 404 });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const received = request.headers.get('x-webhook-secret');
    if (!env.SECRET_VALUE || !received || received !== env.SECRET_VALUE) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (!env.DB) return new Response('Database unavailable', { status: 503 });
    let data;
    try { data = await request.json(); }
    catch { return new Response('Invalid JSON', { status: 400 }); }
    if (data?.type && data.type !== 'INSERT') return Response.json({ ok: true, skipped: true });
    const record = data?.record ?? data;
    const id = typeof record?.id === 'string' ? record.id : '';
    const timestamp = typeof record?.created_at === 'string' ? record.created_at : '';
    const status = typeof record?.status === 'string' ? record.status : 'submitted';
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(id) || !timestamp) {
      return new Response('Invalid record', { status: 400 });
    }
    try {
      await env.DB.prepare('INSERT OR IGNORE INTO certificate_sync_events (request_id, created_at, status) VALUES (?, ?, ?)')
        .bind(id, timestamp, status).run();
      return Response.json({ ok: true, id });
    } catch (err) {
      console.error('GETI certificate D1 write failed');
      return new Response('Database write failed', { status: 500 });
    }
  },
};
