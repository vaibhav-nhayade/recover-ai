"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getRecoveryCases,
  type RecoveryCaseResponse,
} from "@/lib/api";

interface UseRecoveryCasesResult {
  data: RecoveryCaseResponse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRecoveryCases(): UseRecoveryCasesResult {
  const [data, setData] = useState<
    RecoveryCaseResponse[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getRecoveryCases();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recovery cases.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    loading,
    error,
    refresh: load,
  };
}