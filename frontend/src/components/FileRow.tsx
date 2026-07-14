import type { UploadResult } from "../api/client";
import { getDownloadUrl } from "../api/client";

interface FileRowProps {
  result: UploadResult;
}

export default function FileRow({ result }: FileRowProps) {
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
          <a
            className="btn-download"
            href={getDownloadUrl(result.id)}
            download
          >
            Descargar ZIP
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
