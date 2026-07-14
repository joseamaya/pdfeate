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

export function getDownloadUrl(id: string): string {
  return `/api/download/${id}`;
}

export function getPdfDownloadUrl(id: string): string {
  return `/api/download-pdf/${id}`;
}
