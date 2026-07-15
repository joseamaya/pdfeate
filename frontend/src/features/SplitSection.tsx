import { useState } from "react";
import { useFileUpload } from "../hooks/useFileUpload";
import { usePdfOperation } from "../hooks/usePdfOperation";
import { splitPdf, getDownloadUrl } from "../api/client";
import Skeleton from "../components/Skeleton";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { useToast } from "../components/Toast";

export default function SplitSection() {
  const { loading, error, result, progress, execute, reset, setResult, setProgress } = usePdfOperation();
  const {
    selectedFiles,
    dragOver,
    inputRef,
    setDragOver,
    handleFiles,
    removeFile,
    clearFiles,
  } = useFileUpload({
    multiple: false,
    validate: (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
  });
  const [mode, setMode] = useState("all");
  const [everyN, setEveryN] = useState(2);
  const [ranges, setRanges] = useState("");
  const [rangesTouched, setRangesTouched] = useState(false);
  const rangesInvalid = rangesTouched && mode === "ranges" && ranges.trim().length > 0 && !/^(\d+(-\d+)?)(\s*,\s*\d+(-\d+)?)*$/.test(ranges.trim());
  const { toast } = useToast();

  const file = selectedFiles[0] ?? null;

  function handleUpload() {
    if (!file) return;
    execute(
      () =>
        splitPdf(
          file,
          mode,
          mode === "every" ? everyN : undefined,
          mode === "ranges" ? ranges : undefined,
          setProgress,
        ),
      (data) => {
        setResult(data);
        toast("PDF dividido correctamente", "success");
      },
      "Error al dividir el PDF",
    );
  }

  function handleReset() {
    reset();
    clearFiles();
    setMode("all");
    setEveryN(2);
    setRanges("");
  }

  return (
    <div>
      {!file && !loading && !error && !result && (
        <EmptyState
          icon="✂️"
          title="Divide un PDF"
          description="Separa las páginas en archivos individuales o agrupados por rango"
        />
      )}

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer bg-card transition-all hover:border-primary hover:bg-primary-light ${
          dragOver ? "border-primary bg-primary-light scale-[1.01]" : "border-border"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          type="file"
          accept=".pdf"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-text-secondary">
          Arrastra un PDF aquí o haz clic para seleccionarlo
        </p>
      </div>

      {file && !result && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4 animate-fade-in">
          <div className="flex justify-between items-center group">
            <span className="text-sm text-text truncate">{file.name}</span>
            <button
              type="button"
              className="text-error bg-transparent border-none cursor-pointer text-lg p-0 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => removeFile(0)}
              disabled={loading}
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="split-mode"
                value="all"
                checked={mode === "all"}
                onChange={() => setMode("all")}
                className="accent-primary"
              />
              Todas las páginas (una por PDF)
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="split-mode"
                value="every"
                checked={mode === "every"}
                onChange={() => setMode("every")}
                className="accent-primary"
              />
              <span>Cada </span>
              <input
                type="number"
                className="w-16 p-1 border border-border rounded text-sm text-center transition-colors focus:border-primary focus:outline-none"
                min={1}
                value={everyN}
                disabled={mode !== "every"}
                onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span> páginas</span>
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="split-mode"
                value="ranges"
                checked={mode === "ranges"}
                onChange={() => setMode("ranges")}
                className="accent-primary"
              />
              Rangos personalizados
            </label>

            {mode === "ranges" && (
              <div className="ml-6 animate-fade-in">
                <input
                  type="text"
                  className={`w-full p-2 border rounded-md text-sm transition-colors focus:outline-none ${
                    rangesInvalid ? "border-error" : "border-border focus:border-primary"
                  }`}
                  placeholder="Ej: 1-3, 5, 7-9"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  onBlur={() => setRangesTouched(true)}
                />
                {rangesInvalid ? (
                  <span className="block text-xs text-error mt-1">Formato inválido. Ej: 1-3, 5, 7-9</span>
                ) : (
                  <span className="block text-xs text-text-secondary mt-1">Ej: 1-3, 5, 7-9</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleUpload}
              disabled={loading || !file}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Dividiendo...
                </span>
              ) : (
                "Dividir PDF"
              )}
            </button>
            {loading && (
              <span className="text-xs text-text-secondary">{progress}%</span>
            )}
          </div>
          {loading && <ProgressBar progress={progress} className="mt-3" />}
        </div>
      )}

      {loading && !file && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4 animate-fade-in">
          <Skeleton rows={2} height="h-5" />
          <ProgressBar progress={progress} className="mt-3" />
        </div>
      )}

      {error && <ErrorState message={error} onRetry={handleUpload} />}

      {result && (
        <div className="mt-4 animate-fade-in">
          <div className="flex justify-between items-center bg-card border border-border rounded-xl p-3 transition-all hover:shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${result.status === "completed" ? "bg-success" : "bg-error"}`} />
              <span className="text-sm text-text truncate">{result.filename}</span>
              {result.status === "completed" && (
                <span className="bg-primary-light text-primary text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  {result.page_count} págs
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {result.status === "completed" && result.id && (
                <a
                  href={getDownloadUrl(result.id)}
                  className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-all hover:bg-green-700"
                  download
                >
                  Descargar ZIP
                </a>
              )}
              {result.status === "error" && (
                <span className="text-error text-xs">{result.error_detail}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="bg-border text-text rounded-md text-sm font-medium cursor-pointer px-4 py-2 mt-4 transition-all hover:bg-stone-300"
            onClick={handleReset}
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
