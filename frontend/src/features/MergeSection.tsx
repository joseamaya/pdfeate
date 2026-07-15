import { useFileUpload } from "../hooks/useFileUpload";
import { usePdfOperation } from "../hooks/usePdfOperation";
import { mergeUpload, getPdfDownloadUrl } from "../api/client";
import Skeleton from "../components/Skeleton";
import ProgressBar from "../components/ProgressBar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { useToast } from "../components/Toast";

export default function MergeSection() {
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
    multiple: true,
    validate: (f) =>
      f.type === "application/pdf" ||
      f.type.startsWith("image/") ||
      /\.(pdf|jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(f.name),
  });
  const { toast } = useToast();

  function handleUpload() {
    if (selectedFiles.length === 0) return;
    execute(
      () => mergeUpload(selectedFiles, setProgress),
      (data) => {
        setResult(data);
        toast("Archivos unidos correctamente", "success");
      },
      "Error al unir los archivos",
    );
  }

  function handleReset() {
    reset();
    clearFiles();
  }

  const hasContent = selectedFiles.length > 0 || loading || error || result;

  return (
    <div>
      {!hasContent && (
        <EmptyState
          icon="📑"
          title="Une PDFs e imágenes"
          description="Selecciona varios archivos para combinarlos en un solo documento PDF"
        />
      )}

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer bg-card transition-all hover:border-primary hover:bg-primary-light ${
          dragOver ? "border-primary bg-primary-light scale-[1.01]" : "border-border"
        }`}
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
        <div className="mt-4 bg-card border border-border rounded-xl p-4 animate-fade-in">
          <div className="text-sm font-medium text-text mb-2">
            {selectedFiles.length} archivo{selectedFiles.length !== 1 ? "s" : ""} seleccionado{selectedFiles.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, i) => (
              <div key={i} className="flex justify-between items-center group">
                <span className="text-sm text-text truncate">{file.name}</span>
                <button
                  type="button"
                  className="text-error bg-transparent border-none cursor-pointer text-lg p-0 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => removeFile(i)}
                  disabled={loading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
            {loading && (
              <span className="text-xs text-text-secondary">{progress}%</span>
            )}
          </div>
          {loading && <ProgressBar progress={progress} className="mt-3" />}
        </div>
      )}

      {loading && !selectedFiles.length && (
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
                  className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-all hover:bg-green-700"
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
