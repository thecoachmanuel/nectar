import { useState, useCallback } from "react";
import { toast } from "sonner";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  successMessage?: string;
}

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (url: string, options: ApiOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const result = await res.json();
      
      if (!res.ok || !result.status) {
        throw new Error(result.message || "Something went wrong");
      }

      setData(result.data);
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, data, setData, loading, error };
}
