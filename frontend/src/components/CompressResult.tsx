import type { UploadResult } from "../api/client";
import { getPdfDownloadUrl } from "../api/client";

interface CompressResultProps {
  result: UploadResult | null;
}

export default function CompressResult({ result }: CompressResultProps) {
  if (!result) return null;

  const downloadName = result.filename.replace(/\.pdf$/i, "_comprimido.pdf");

  return (
    <div className="flex justify-between items-center bg-card border border-border rounded-xl p-3 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-sm truncate">{result.filename}</span>
        {result.status === "completed" && (
          <span className="inline-block bg-primary-light text-primary text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">{result.page_count} páginas</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {result.status === "completed" && result.id && (
          <a className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-colors hover:bg-green-700 inline-block" href={getPdfDownloadUrl(result.id, downloadName)} download={downloadName}>
            Descargar PDF
          </a>
        )}
        {result.status === "error" && (
          <span className="text-error text-xs max-w-40 truncate" title={result.error_detail ?? ""}>
            {result.error_detail}
          </span>
        )}
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${result.status === "completed" ? "bg-success" : result.status === "error" ? "bg-error" : "bg-text-secondary"}`} />
      </div>
    </div>
  );
}
