import { useState } from "react";
import { useFileUpload } from "../hooks/useFileUpload";
import { usePdfOperation } from "../hooks/usePdfOperation";
import { compressPdf, getPdfDownloadUrl } from "../api/client";
import Skeleton from "../components/Skeleton";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { useToast } from "../components/Toast";

export default function CompressSection() {
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
  const [quality, setQuality] = useState(60);
  const [reduceDpi, setReduceDpi] = useState(true);
  const { toast } = useToast();

  const file = selectedFiles[0] ?? null;

  function handleUpload() {
    if (!file) return;
    execute(
      () => compressPdf(file, quality, reduceDpi, setProgress),
      (data) => {
        setResult(data);
        toast("PDF comprimido correctamente", "success");
      },
      "Error al comprimir el PDF",
    );
  }

  function handleReset() {
    reset();
    clearFiles();
    setQuality(60);
    setReduceDpi(true);
  }

  const downloadName =
    result?.filename.replace(/\.pdf$/i, "_comprimido.pdf") ?? "";

  return (
    <div>
      {!file && !loading && !error && !result && (
        <EmptyState
          icon="🗜️"
          title="Comprime un PDF"
          description="Reduce el tamaño ajustando la calidad de imagen y la resolución"
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

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="quality-slider" className="text-sm text-text">
                Calidad: <strong>{quality}%</strong>
              </label>
              <input
                id="quality-slider"
                type="range"
                className="w-full accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                min={10}
                max={90}
                step={5}
                value={quality}
                disabled={loading}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>Más compresión</span>
                <span>Más calidad</span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={reduceDpi}
                disabled={loading}
                onChange={(e) => setReduceDpi(e.target.checked)}
                className="accent-primary"
              />
              Reducir resolución (150 DPI)
            </label>
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
                  Comprimiendo...
                </span>
              ) : (
                "Comprimir PDF"
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
                  href={getPdfDownloadUrl(result.id, downloadName)}
                  className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-all hover:bg-green-700"
                  download={downloadName}
                >
                  Descargar PDF
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
