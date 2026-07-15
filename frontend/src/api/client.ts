export interface UploadResult {
  id: string | null;
  filename: string;
  page_count: number;
  status: string;
  error_detail: string | null;
}

export async function uploadPdfs(files: File[]): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }

  return res.json();
}

export async function mergeUpload(files: File[]): Promise<UploadResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch("/api/merge", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Merge failed");
  }

  return res.json();
}

export async function splitPdf(
  file: File,
  mode: string,
  everyN?: number,
  ranges?: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  if (everyN !== undefined) formData.append("every_n", String(everyN));
  if (ranges !== undefined) formData.append("ranges", ranges);

  const res = await fetch("/api/split", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Split failed");
  }

  return res.json();
}

export async function compressPdf(
  file: File,
  quality: number,
  reduceDpi: boolean,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("quality", String(quality));
  formData.append("reduce_dpi", String(reduceDpi));

  const res = await fetch("/api/compress", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Compress failed");
  }

  return res.json();
}

export interface PageOp {
  page: number;
  rotate: number;
}

export async function organizeUpload(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/organize/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }

  return res.json();
}

export async function organizeApply(fileId: string, pages: PageOp[]): Promise<UploadResult> {
  const res = await fetch("/api/organize/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, pages }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Apply failed");
  }

  return res.json();
}

export function getThumbnailUrl(fileId: string, page: number): string {
  return `/api/organize/thumbnail/${fileId}/${page}`;
}

export async function organizeCleanup(fileId: string): Promise<void> {
  await fetch(`/api/organize/cleanup/${fileId}`, { method: "DELETE" });
}

export async function extractPages(
  file: File,
  pages: string,
  output: "zip" | "pdf",
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pages", pages);
  formData.append("output", output);

  const res = await fetch("/api/extract", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Extract failed");
  }

  return res.json();
}

export async function addWatermark(
  file: File,
  text: string,
  opacity: number,
  position: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("text", text);
  formData.append("opacity", String(opacity));
  formData.append("position", position);

  const res = await fetch("/api/watermark", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Watermark failed");
  }

  return res.json();
}

export async function protectPdf(file: File, password: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  const res = await fetch("/api/protect", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Protect failed");
  }

  return res.json();
}

export async function unlockPdf(file: File, password: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  const res = await fetch("/api/unlock", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Unlock failed");
  }

  return res.json();
}

export function getDownloadUrl(id: string): string {
  return `/api/download/${id}`;
}

export function getPdfDownloadUrl(id: string, name?: string): string {
  const params = name ? `?name=${encodeURIComponent(name)}` : "";
  return `/api/download-pdf/${id}${params}`;
}
