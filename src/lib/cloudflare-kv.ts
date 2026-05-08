// Cloudflare KV REST API Client
// Used for invite tokens with TTL

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CF_KV_NS_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID!;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

const KV_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NS_ID}`;

const headers = () => ({
  'Authorization': `Bearer ${CF_API_TOKEN}`,
});

export async function kvGet(key: string): Promise<string | null> {
  const res = await fetch(`${KV_BASE}/values/${encodeURIComponent(key)}`, {
    headers: headers(),
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('KV GET failed:', res.status);
    return null;
  }

  return await res.text();
}

export async function kvPut(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
  const url = new URL(`${KV_BASE}/values/${encodeURIComponent(key)}`);
  if (ttlSeconds) {
    url.searchParams.set('expiration_ttl', String(ttlSeconds));
  }

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      ...headers(),
      'Content-Type': 'text/plain',
    },
    body: value,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('KV PUT failed:', res.status, text);
    return false;
  }

  return true;
}

export async function kvDelete(key: string): Promise<boolean> {
  const res = await fetch(`${KV_BASE}/values/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: headers(),
  });

  return res.ok;
}
