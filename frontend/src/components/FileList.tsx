import type { UploadResult } from "../api/client";
import FileRow from "./FileRow";

interface FileListProps {
  results: UploadResult[];
}

export default function FileList({ results }: FileListProps) {
  if (results.length === 0) return null;

  const completed = results.filter((r) => r.status === "completed").length;
  const errors = results.filter((r) => r.status === "error").length;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-sm text-text-secondary mb-3">
        <span>{results.length} archivo(s) procesado(s)</span>
        <span className="text-success">{completed} completado(s)</span>
        {errors > 0 && <span className="text-error">{errors} fallido(s)</span>}
      </div>
      {results.map((result, i) => (
        <FileRow key={i} result={result} />
      ))}
    </div>
  );
}
