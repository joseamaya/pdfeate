import Skeleton from "../components/Skeleton";
import { useFileUpload } from "../hooks/useFileUpload";
import { usePdfOperation } from "../hooks/usePdfOperation";
import { mergeUpload, getPdfDownloadUrl } from "../api/client";

export default function MergeSection() {
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
    multiple: true,
    validate: (f) =>
      f.type === "application/pdf" ||
      f.type.startsWith("image/") ||
      /\.(pdf|jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(f.name),
  });

  function handleUpload() {
    if (selectedFiles.length === 0) return;
    execute(
      () => mergeUpload(selectedFiles),
      (data) => setResult(data),
      "Error al unir los archivos",
    );
  }

  function handleReset() {
    reset();
    clearFiles();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h2 className="text-lg font-semibold text-text mb-1">Unir PDFs</h2>
      <p className="text-sm text-text-secondary mb-4">
        Combina varios PDFs e imágenes en un solo documento PDF
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
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff"
          multiple
          ref={inputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-text-secondary">
          Arrastra PDFs e imágenes aquí o haz clic para seleccionarlos
        </p>
      </div>

      {selectedFiles.length > 0 && !result && (
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
                Uniendo...
              </span>
            ) : (
              "Unir y descargar PDF"
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
              <span className="text-sm text-text truncate">PDF unificado</span>
              {result.status === "completed" && (
                <span className="bg-primary-light text-primary text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  {result.page_count} págs
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {result.status === "completed" && result.id && (
                <a
                  href={getPdfDownloadUrl(result.id)}
                  className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-colors hover:bg-green-700"
                  download
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
