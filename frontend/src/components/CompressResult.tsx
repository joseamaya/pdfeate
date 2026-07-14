import type { UploadResult } from "../api/client";
import { getPdfDownloadUrl } from "../api/client";

interface CompressResultProps {
  result: UploadResult | null;
}

export default function CompressResult({ result }: CompressResultProps) {
  if (!result) return null;

  const downloadName = result.filename.replace(/\.pdf$/i, "_comprimido.pdf");

  return (
    <div className={`file-row status-${result.status}`}>
      <div className="file-info">
        <span className="file-name">{result.filename}</span>
        {result.status === "completed" && (
          <span className="badge">{result.page_count} páginas</span>
        )}
      </div>

      <div className="file-actions">
        {result.status === "completed" && result.id && (
          <a className="btn-download" href={getPdfDownloadUrl(result.id, downloadName)} download={downloadName}>
            Descargar PDF
          </a>
        )}
        {result.status === "error" && (
          <span className="error-text" title={result.error_detail ?? ""}>
            {result.error_detail}
          </span>
        )}
        <span className={`status-dot ${result.status}`} />
      </div>
    </div>
  );
}
