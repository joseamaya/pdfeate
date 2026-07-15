import { useState, useCallback, useRef } from "react";
import type { UploadResult } from "../api/client";

interface UsePdfOperationState {
  loading: boolean;
  error: string | null;
  result: UploadResult | null;
  progress: number;
}

export function usePdfOperation() {
  const [state, setState] = useState<UsePdfOperationState>({
    loading: false,
    error: null,
    result: null,
    progress: 0,
  });

  const lastFn = useRef<(() => Promise<unknown>) | null>(null);
  const lastErrorMsg = useRef("");

  const execute = useCallback(
    async <T>(fn: () => Promise<T>, onSuccess: (data: T) => void, errorMsg: string) => {
      lastFn.current = fn;
      lastErrorMsg.current = errorMsg;
      setState({ loading: true, error: null, result: null, progress: 0 });
      try {
        const data = await fn();
        setState({ loading: false, error: null, result: null, progress: 100 });
        onSuccess(data);
      } catch (err) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : errorMsg,
          result: null,
          progress: 0,
        });
      }
    },
    [],
  );

  const retry = useCallback(() => {
    if (lastFn.current) {
      execute(lastFn.current, () => {}, lastErrorMsg.current);
    }
  }, [execute]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null, progress: 0 });
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    setResult: (result: UploadResult | null) =>
      setState((prev) => ({ ...prev, result })),
    setProgress: (progress: number) =>
      setState((prev) => ({ ...prev, progress })),
  };
}
