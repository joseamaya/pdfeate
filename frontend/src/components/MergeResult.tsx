import type { UploadResult } from "../api/client";
import { getPdfDownloadUrl } from "../api/client";

interface MergeResultProps {
  result: UploadResult | null;
}

export default function MergeResult({ result }: MergeResultProps) {
  if (!result) return null;

  return (
    <div className={`file-row status-${result.status}`}>
      <div className="file-info">
        <span className="file-name">PDF unificado</span>
        {result.status === "completed" && (
          <span className="badge">{result.page_count} páginas</span>
        )}
      </div>

      <div className="file-actions">
        {result.status === "completed" && result.id && (
          <a className="btn-download" href={getPdfDownloadUrl(result.id)} download>
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
