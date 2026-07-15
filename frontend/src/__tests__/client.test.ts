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

describe("uploadPdfs", () => {
  it("calls /api/upload with FormData", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: "1", filename: "test.pdf", page_count: 3, status: "completed", error_detail: null }]),
    });
    vi.stubGlobal("fetch", mockFetch);

    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    const result = await uploadPdfs([file]);

    expect(mockFetch).toHaveBeenCalledWith("/api/upload", expect.objectContaining({
      method: "POST",
      body: expect.any(FormData),
    }));
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe("test.pdf");
  });

  it("throws on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("Upload failed"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    await expect(uploadPdfs([file])).rejects.toThrow("Upload failed");
  });
});
