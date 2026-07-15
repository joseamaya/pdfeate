import { useRef, useState } from "react";
import { extractPages, getDownloadUrl, getPdfDownloadUrl } from "../api/client";
import type { UploadResult } from "../api/client";

type Phase = "upload" | "result";

export default function ExtractUpload() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [output, setOutput] = useState<"zip" | "pdf">("zip");
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
    if (!selectedFile || !pages.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await extractPages(selectedFile, pages.trim(), output);
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al extraer páginas");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPhase("upload");
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setPages("");
  }

  if (phase === "result") {
    const downloadName = result?.filename?.replace(/\.pdf$/i, "_extraido.pdf");
    return (
      <div className="file-row status-completed">
        <div className="file-info">
          <span className="file-name">{result?.filename}</span>
          {result?.status === "completed" && (
            <span className="badge">{result.page_count} páginas</span>
          )}
        </div>
        <div className="file-actions">
          {result?.status === "completed" && result?.id && (
            <a
              className="btn-download"
              href={output === "zip" ? getDownloadUrl(result.id) : getPdfDownloadUrl(result.id, downloadName)}
              download
            >
              Descargar {output === "zip" ? "ZIP" : "PDF"}
            </a>
          )}
          {result?.status === "error" && (
            <span className="error-text" title={result.error_detail ?? ""}>
              {result.error_detail}
            </span>
          )}
          <span className={`status-dot ${result?.status}`} />
        </div>
        <div className="reset-container">
          <button className="btn-reset" onClick={handleReset}>
            Extraer otras páginas
          </button>
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
        <input
          type="file"
          accept=".pdf"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="drop-text">Arrastra un PDF aquí o haz clic para seleccionarlo</p>
      </div>

      {selectedFile && (
        <div className="file-preview">
          <h3>Archivo seleccionado</h3>
          <ul className="file-list">
            <li>
              <span>{selectedFile.name}</span>
              <button type="button" className="btn-remove" onClick={() => setSelectedFile(null)} disabled={loading}>
                ✕
              </button>
            </li>
          </ul>

          <div className="split-options">
            <label className="split-option">
              <span>Páginas a extraer</span>
            </label>
            <input
              type="text"
              className="split-text-input"
              placeholder="Ej: 1-3, 5, 7-9"
              value={pages}
              disabled={loading}
              onChange={(e) => setPages(e.target.value)}
            />
            <span className="split-hint">Ej: 1-3, 5, 7-9</span>

            <label className="split-option" style={{ marginTop: "0.5rem" }}>
              <input type="radio" name="output" value="zip" checked={output === "zip"} onChange={() => setOutput("zip")} />
              <span>Descargar como ZIP (páginas individuales)</span>
            </label>
            <label className="split-option">
              <input type="radio" name="output" value="pdf" checked={output === "pdf"} onChange={() => setOutput("pdf")} />
              <span>Descargar como PDF único</span>
            </label>
          </div>

          <button className="btn-upload" onClick={handleSubmit} disabled={loading || !pages.trim()}>
            {loading ? "Extrayendo..." : "Extraer páginas"}
          </button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading && (
        <div className="loader-container">
          <div className="loader" />
          <span>Extrayendo páginas...</span>
        </div>
      )}
    </div>
  );
}
