import { useState } from "react";
import Skeleton from "../components/Skeleton";
import { useFileUpload } from "../hooks/useFileUpload";
import { usePdfOperation } from "../hooks/usePdfOperation";
import { splitPdf, getDownloadUrl } from "../api/client";

export default function SplitSection() {
  const { loading, error, result, execute, reset, setResult } = usePdfOperation();
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
        ),
      (data) => setResult(data),
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
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-lg font-semibold text-text mb-1">Dividir PDF</h2>
      <p className="text-sm text-text-secondary mb-4">
        Divide un PDF en varios documentos separados
      </p>

      <div
        className={`border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer bg-card transition-colors hover:border-primary ${dragOver ? "border-primary bg-primary-light" : ""}`}
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
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text truncate">{file.name}</span>
            <button
              type="button"
              className="text-error bg-transparent border-none cursor-pointer text-lg p-0 disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="w-16 p-1 border border-border rounded text-sm text-center"
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
              <div className="ml-6">
                <input
                  type="text"
                  className={`w-full p-2 border rounded-md text-sm ${rangesInvalid ? "border-error" : "border-border"}`}
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

          <button
            type="button"
            className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 mt-4 transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      )}

      {loading && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <Skeleton rows={2} height="h-5" />
          <div className="flex justify-end mt-3">
            <div className="w-32 h-9 bg-border rounded-md animate-pulse" />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-error text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <div className="flex justify-between items-center bg-card border border-border rounded-xl p-3">
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
                  className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-colors hover:bg-green-700"
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
            className="bg-border text-text rounded-md text-sm font-medium cursor-pointer px-4 py-2 mt-4 transition-colors hover:bg-stone-300"
            onClick={handleReset}
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
