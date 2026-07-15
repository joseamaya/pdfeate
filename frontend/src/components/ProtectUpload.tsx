import { useRef, useState } from "react";
import { protectPdf, getPdfDownloadUrl } from "../api/client";
import type { UploadResult } from "../api/client";

type Phase = "upload" | "result";

export default function ProtectUpload() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const pdf = Array.from(files).find(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    if (pdf) setSelectedFile(pdf);
  }

  async function handleSubmit() {
    if (!selectedFile || !password) return;
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
    try {
      const data = await protectPdf(selectedFile, password);
      setResult(data);
      setPhase("result");
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
  }

  if (phase === "result") {
    const downloadName = result?.filename?.replace(/\.pdf$/i, "_protegido.pdf");
    return (
      <div className="file-row status-completed">
        <div className="file-info">
          <span className="file-name">{result?.filename}</span>
          {result?.status === "completed" && <span className="badge">{result.page_count} páginas</span>}
        </div>
        <div className="file-actions">
          {result?.status === "completed" && result?.id && (
            <a className="btn-download" href={getPdfDownloadUrl(result.id, downloadName)} download>
              Descargar PDF protegido
            </a>
          )}
          {result?.status === "error" && (
            <span className="error-text" title={result.error_detail ?? ""}>{result.error_detail}</span>
          )}
          <span className={`status-dot ${result?.status}`} />
        </div>
        <div className="reset-container">
          <button className="btn-reset" onClick={handleReset}>Proteger otro PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-section">
      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !selectedFile && inputRef.current?.click()}
      >
        <input type="file" accept=".pdf" ref={inputRef} style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)} />
        <p className="drop-text">Arrastra un PDF aquí o haz clic para seleccionarlo</p>
      </div>

      {selectedFile && (
        <div className="file-preview">
          <h3>Archivo seleccionado</h3>
          <ul className="file-list">
            <li>
              <span>{selectedFile.name}</span>
              <button type="button" className="btn-remove" onClick={() => setSelectedFile(null)} disabled={loading}>✕</button>
            </li>
          </ul>

          <div className="compress-options">
            <div className="compress-option">
              <label className="compress-label" htmlFor="protect-pass">Contraseña</label>
              <input
                id="protect-pass"
                type="password"
                className="split-text-input"
                placeholder="Mínimo 4 caracteres"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="compress-option">
              <label className="compress-label" htmlFor="protect-confirm">Confirmar contraseña</label>
              <input
                id="protect-confirm"
                type="password"
                className="split-text-input"
                placeholder="Repite la contraseña"
                value={confirm}
                disabled={loading}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          <button className="btn-upload" onClick={handleSubmit} disabled={loading || !password || !confirm}>
            {loading ? "Protegiendo..." : "Proteger PDF"}
          </button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading && (
        <div className="loader-container">
          <div className="loader" />
          <span>Protegiendo PDF...</span>
        </div>
      )}
    </div>
  );
}
