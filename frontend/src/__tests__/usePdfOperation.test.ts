import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { usePdfOperation } from "../hooks/usePdfOperation";

describe("usePdfOperation", () => {
  it("starts with idle state", () => {
    const { result } = renderHook(() => usePdfOperation());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("sets loading during execute", async () => {
    const { result } = renderHook(() => usePdfOperation());
    const fn = vi.fn().mockResolvedValue("ok");

    act(() => {
      result.current.execute(fn, () => {}, "error");
    });

    expect(result.current.loading).toBe(true);
  });

  it("calls onSuccess on resolve", async () => {
    const { result } = renderHook(() => usePdfOperation());
    const onSuccess = vi.fn();

    await act(async () => {
      await result.current.execute(
        () => Promise.resolve("data"),
        onSuccess,
        "error",
      );
    });

    expect(onSuccess).toHaveBeenCalledWith("data");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on reject", async () => {
    const { result } = renderHook(() => usePdfOperation());

    await act(async () => {
      await result.current.execute(
        () => Promise.reject(new Error("falló")),
        () => {},
        "error genérico",
      );
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("falló");
    expect(result.current.result).toBeNull();
  });

  it("uses fallback error message when error is not an Error", async () => {
    const { result } = renderHook(() => usePdfOperation());

    await act(async () => {
      await result.current.execute(
        () => Promise.reject("string error"),
        () => {},
        "fallback msg",
      );
    });

    expect(result.current.error).toBe("fallback msg");
  });

  it("reset clears state", async () => {
    const { result } = renderHook(() => usePdfOperation());

    await act(async () => {
      await result.current.execute(
        () => Promise.reject(new Error("fail")),
        () => {},
        "err",
      );
    });

    expect(result.current.error).toBe("fail");

    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("setResult updates result", () => {
    const { result } = renderHook(() => usePdfOperation());
    const r = { id: "123", filename: "test.pdf", page_count: 5, status: "completed", error_detail: null };

    act(() => {
      result.current.setResult(r);
    });

    expect(result.current.result).toEqual(r);
  });
});
