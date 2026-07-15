import { useState, useCallback } from "react";
import type { UploadResult } from "../api/client";

interface UsePdfOperationState {
  loading: boolean;
  error: string | null;
  result: UploadResult | null;
}

export function usePdfOperation() {
  const [state, setState] = useState<UsePdfOperationState>({
    loading: false,
    error: null,
    result: null,
  });

  const execute = useCallback(
    async <T>(fn: () => Promise<T>, onSuccess: (data: T) => void, errorMsg: string) => {
      setState({ loading: true, error: null, result: null });
      try {
        const data = await fn();
        onSuccess(data);
        setState((prev) => ({ ...prev, loading: false }));
      } catch (err) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : errorMsg,
          result: null,
        });
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null });
  }, []);

  return { ...state, execute, reset, setResult: (result: UploadResult | null) => setState((prev) => ({ ...prev, result })) };
}
