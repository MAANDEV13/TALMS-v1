// Cloudflare D1 REST API Client
// Calls D1 from Next.js API routes on Vercel via HTTP

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CF_D1_DB_ID = process.env.CLOUDFLARE_D1_DATABASE_ID!;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DB_ID}/query`;

interface D1Result {
  results: any[];
  success: boolean;
  meta?: any;
}

interface D1Response {
  result: D1Result[];
  success: boolean;
  errors: any[];
}

export async function d1Query(sql: string, params: any[] = []): Promise<any[]> {
  const res = await fetch(D1_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('D1 query failed:', res.status, text);
    throw new Error(`D1 query failed: ${res.status} ${text}`);
  }

  const data: D1Response = await res.json();

  if (!data.success || data.errors?.length > 0) {
    console.error('D1 error:', data.errors);
    throw new Error(`D1 error: ${JSON.stringify(data.errors)}`);
  }

  return data.result?.[0]?.results || [];
}

export async function d1Execute(sql: string, params: any[] = []): Promise<{ changes: number; lastRowId: number }> {
  const res = await fetch(D1_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 execute failed: ${res.status} ${text}`);
  }

  const data: D1Response = await res.json();

  if (!data.success || data.errors?.length > 0) {
    throw new Error(`D1 error: ${JSON.stringify(data.errors)}`);
  }

  return {
    changes: data.result?.[0]?.meta?.changes || 0,
    lastRowId: data.result?.[0]?.meta?.last_row_id || 0,
  };
}

export async function d1Batch(statements: { sql: string; params?: any[] }[]): Promise<any[][]> {
  const res = await fetch(D1_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(statements.map(s => ({ sql: s.sql, params: s.params || [] }))),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`D1 batch failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return (data.result || []).map((r: any) => r.results || []);
}
