import { useState } from "react";
import { useFileUpload } from "../hooks/useFileUpload";
import { usePdfOperation } from "../hooks/usePdfOperation";
import { uploadPdfs, getDownloadUrl } from "../api/client";
import type { UploadResult } from "../api/client";
import Skeleton from "../components/Skeleton";

export default function ConvertSection() {
  const { loading, error, execute, reset } = usePdfOperation();
  const {
    selectedFiles,
    dragOver,
    inputRef,
    setDragOver,
    handleFiles,
    removeFile,
    clearFiles,
  } = useFileUpload({
    multiple: true,
    validate: (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
  });
  const [results, setResults] = useState<UploadResult[]>([]);

  function handleUpload() {
    if (selectedFiles.length === 0) return;
    execute(
      () => uploadPdfs(selectedFiles),
      (data) => setResults(data),
      "Error al subir los archivos",
    );
  }

  function handleReset() {
    reset();
    clearFiles();
    setResults([]);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-lg font-semibold text-text mb-1">Convertir PDF a JPG</h2>
      <p className="text-sm text-text-secondary mb-4">
        Convierte las páginas de tus PDFs en imágenes JPG de alta calidad
      </p>

      <div
        className={`border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer bg-card transition-colors hover:border-primary ${dragOver ? "border-primary bg-primary-light" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          ref={inputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-text-secondary">
          Arrastra los PDFs aquí o haz clic para seleccionarlos
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <div className="space-y-2">
            {selectedFiles.map((file, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-text truncate">{file.name}</span>
                <button
                  type="button"
                  className="text-error bg-transparent border-none cursor-pointer text-lg p-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => removeFile(i)}
                  disabled={loading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 mt-4 transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUpload}
            disabled={loading || selectedFiles.length === 0}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Subiendo...
              </span>
            ) : (
              "Subir y convertir"
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

      {results.length > 0 && (
        <div className="mt-4">
          {results.map((r, i) => (
            <div key={i} className="flex justify-between items-center bg-card border border-border rounded-xl p-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${r.status === "completed" ? "bg-success" : "bg-error"}`} />
                <span className="text-sm text-text truncate">{r.filename}</span>
                {r.status === "completed" && (
                  <span className="bg-primary-light text-primary text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                    {r.page_count} págs
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {r.status === "completed" && r.id && (
                  <a
                    href={getDownloadUrl(r.id)}
                    className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-colors hover:bg-green-700"
                    download
                  >
                    Descargar ZIP
                  </a>
                )}
                {r.status === "error" && (
                  <span className="text-error text-xs">{r.error_detail}</span>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="bg-border text-text rounded-md text-sm font-medium cursor-pointer px-4 py-2 mt-2 transition-colors hover:bg-stone-300"
            onClick={handleReset}
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
