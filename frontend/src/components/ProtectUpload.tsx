import { useRef, useState } from "react";
import { protectPdf, getPdfDownloadUrl } from "../api/client";
import type { UploadResult } from "../api/client";
import ProgressBar from "./ProgressBar";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";
import { useToast } from "./Toast";

type Phase = "upload" | "result";

export default function ProtectUpload() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const pdf = Array.from(files).find(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    if (pdf) setSelectedFile(pdf);
  }

  const [touched, setTouched] = useState(false);
  const passError = touched && password.length > 0 && password.length < 4;
  const matchError = touched && confirm.length > 0 && password !== confirm;

  async function handleSubmit() {
    if (!selectedFile || !password) return;
    setTouched(true);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const data = await protectPdf(selectedFile, password, setProgress);
      setResult(data);
      setPhase("result");
      toast("PDF protegido correctamente", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al proteger el PDF");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPhase("upload");
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setPassword("");
    setConfirm("");
    setProgress(0);
  }

  if (phase === "result") {
    const downloadName = result?.filename?.replace(/\.pdf$/i, "_protegido.pdf");
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center bg-card border border-border rounded-xl p-3 mb-2 transition-all hover:shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">{result?.filename}</span>
            {result?.status === "completed" && <span className="inline-block bg-primary-light text-primary text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">{result.page_count} páginas</span>}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {result?.status === "completed" && result?.id && (
              <a className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-all hover:bg-green-700 inline-block" href={getPdfDownloadUrl(result.id, downloadName)} download>
                Descargar PDF protegido
              </a>
            )}
            {result?.status === "error" && (
              <span className="text-error text-xs max-w-40 truncate" title={result.error_detail ?? ""}>{result.error_detail}</span>
            )}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${result?.status === "completed" ? "bg-success" : "bg-error"}`} />
          </div>
        </div>
        <div className="mt-4 text-center">
          <button className="bg-border text-text rounded-md text-sm font-medium cursor-pointer px-4 py-2 transition-all hover:bg-stone-300" onClick={handleReset}>Proteger otro PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!selectedFile && !loading && !error && (
        <EmptyState
          icon="🔒"
          title="Protege un PDF con contraseña"
          description="Añade una capa de seguridad a tus documentos"
        />
      )}

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer bg-card transition-all hover:border-primary hover:bg-primary-light ${
          dragOver ? "border-primary bg-primary-light scale-[1.01]" : "border-border"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !selectedFile && inputRef.current?.click()}
      >
        <input type="file" accept=".pdf" ref={inputRef} style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)} />
        <p className="text-text-secondary">Arrastra un PDF aquí o haz clic para seleccionarlo</p>
      </div>

      {selectedFile && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4 animate-fade-in">
          <div className="flex justify-between items-center group">
            <span className="text-sm text-text truncate">{selectedFile.name}</span>
            <button type="button" className="text-error bg-transparent border-none cursor-pointer text-lg p-0 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed" onClick={() => setSelectedFile(null)} disabled={loading}>✕</button>
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-text mb-1" htmlFor="protect-pass">Contraseña</label>
              <input
                id="protect-pass"
                type="password"
                className={`w-full p-2 border rounded-md text-sm transition-colors focus:outline-none ${
                  passError || matchError ? "border-error" : "border-border focus:border-primary"
                }`}
                placeholder="Mínimo 4 caracteres"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
              />
              {passError && <span className="text-error text-xs mt-1 block">Mínimo 4 caracteres</span>}
            </div>
            <div>
              <label className="block text-sm text-text mb-1" htmlFor="protect-confirm">Confirmar contraseña</label>
              <input
                id="protect-confirm"
                type="password"
                className={`w-full p-2 border rounded-md text-sm transition-colors focus:outline-none ${
                  matchError ? "border-error" : "border-border focus:border-primary"
                }`}
                placeholder="Repite la contraseña"
                value={confirm}
                disabled={loading}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setTouched(true)}
              />
              {matchError && <span className="text-error text-xs mt-1 block">Las contraseñas no coinciden</span>}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-5 py-2 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSubmit} disabled={loading || !password || !confirm}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Protegiendo...
                </span>
              ) : "Proteger PDF"}
            </button>
            {loading && <span className="text-xs text-text-secondary">{progress}%</span>}
          </div>
          {loading && <ProgressBar progress={progress} className="mt-3" />}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={handleSubmit} />}
    </div>
  );
}
