'use client';

// Data fetching hook — replaces direct MOCK_DB calls in dashboard pages
// Usage: const { data, loading, refetch } = useData('agencies');
//        const { mutate } = useMutate();

import { useState, useEffect, useCallback } from 'react';

export function useData<T = any>(table: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/data?table=${table}`);
      if (res.status === 401) {
        setData([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data?table=settings')
      .then(r => r.json())
      .then(d => setSettings(d || {}))
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}

export async function mutateData(table: string, action: string, data: any) {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, action, data }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Operation failed');
  }

  return await res.json();
}

// Convenience: log an activity
export async function logActivity(user: string, action: string, target: string) {
  return mutateData('activities', 'log', { user, action, target });
}
