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

export function getDownloadUrl(id: string): string {
  return `/api/download/${id}`;
}

export function getPdfDownloadUrl(id: string, name?: string): string {
  const params = name ? `?name=${encodeURIComponent(name)}` : "";
  return `/api/download-pdf/${id}${params}`;
}
