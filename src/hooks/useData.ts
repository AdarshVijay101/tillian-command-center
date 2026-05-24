import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useHealth(pollIntervalMs = 10000) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    const res = await api.getHealth();
    if (res.ok) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, pollIntervalMs);
    window.addEventListener('Local AI:refresh', fetchHealth);
    return () => {
      clearInterval(interval);
      window.removeEventListener('Local AI:refresh', fetchHealth);
    };
  }, [fetchHealth, pollIntervalMs]);

  return { data, loading, error, refetch: fetchHealth };
}

export function useLatestFiles(pollIntervalMs = 30000) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const res = await api.getLatestFiles();
    if (res.ok) {
      setData(res.data as any[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, pollIntervalMs);
    window.addEventListener('Local AI:refresh', fetchFiles);
    return () => {
      clearInterval(interval);
      window.removeEventListener('Local AI:refresh', fetchFiles);
    };
  }, [fetchFiles, pollIntervalMs]);

  return { data, loading, refetch: fetchFiles };
}

export const useValidation = (pollIntervalMs: number = 30000) => {
  const [data, setData] = useState<any>(null);

  const fetchValidation = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8787/api/config/validate');
      const json = await res.json();
      if (json.ok) setData(json.data);
    } catch {
      // Background fails silently
    }
  };

  useEffect(() => {
    fetchValidation();
    const interval = setInterval(fetchValidation, pollIntervalMs);
    window.addEventListener('Local AI:refresh', fetchValidation);
    return () => {
      clearInterval(interval);
      window.removeEventListener('Local AI:refresh', fetchValidation);
    };
  }, [pollIntervalMs]);

  return { data };
};

