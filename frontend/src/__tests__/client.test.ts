import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadPdfs, getDownloadUrl, getPdfDownloadUrl } from "../api/client";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getDownloadUrl", () => {
  it("returns correct URL", () => {
    expect(getDownloadUrl("abc123")).toBe("/api/download/abc123");
  });
});

describe("getPdfDownloadUrl", () => {
  it("returns URL with name param when provided", () => {
    const url = getPdfDownloadUrl("abc123", "documento.pdf");
    expect(url).toContain("/api/download-pdf/abc123");
    expect(url).toContain("name=documento.pdf");
  });

  it("returns URL without name param when omitted", () => {
    const url = getPdfDownloadUrl("abc123");
    expect(url).toBe("/api/download-pdf/abc123");
  });
});

function createXhrMock() {
  let status = 200;
  let responseText = "";
  let getResponseHeaderVal = "application/json";
  const open = vi.fn();
  const send = vi.fn();
  const abort = vi.fn();
  const setRequestHeader = vi.fn();

  class XhrMock {
    open = open;
    send = send;
    abort = abort;
    setRequestHeader = setRequestHeader;
    upload = {} as Record<string, unknown>;
    getResponseHeader = vi.fn(() => getResponseHeaderVal);
    readyState = 4;
    get status() { return status; }
    set status(v) { status = v; }
    get responseText() { return responseText; }
    set responseText(v) { responseText = v; }
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    ontimeout: (() => void) | null = null;
  }

  function resolve(body: string, s = 200) {
    status = s;
    responseText = body;
    getResponseHeaderVal = s === 200 ? "application/json" : "text/plain";
    if (instance.onload) instance.onload();
  }

  let instance: XhrMock;

  vi.stubGlobal("XMLHttpRequest", function (this: XhrMock) {
    instance = new XhrMock();
    return instance;
  } as unknown as typeof XMLHttpRequest);

  return { resolve };
}

describe("uploadPdfs", () => {
  it("calls /api/upload with FormData", async () => {
    const { resolve } = createXhrMock();

    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    const promise = uploadPdfs([file]);

    resolve(JSON.stringify([{ id: "1", filename: "test.pdf", page_count: 3, status: "completed", error_detail: null }]));

    const result = await promise;
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe("test.pdf");
  });

  it("throws on non-ok response", async () => {
    const { resolve } = createXhrMock();

    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    const promise = uploadPdfs([file]);

    resolve("Upload failed", 500);

    await expect(promise).rejects.toThrow("Upload failed");
  });
});
