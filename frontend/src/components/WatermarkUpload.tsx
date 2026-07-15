import { useRef, useState } from "react";
import { addWatermark, getPdfDownloadUrl } from "../api/client";
import type { UploadResult } from "../api/client";

type Phase = "upload" | "result";

const POSITIONS = [
  { value: "center", label: "Centrado" },
  { value: "top-left", label: "Superior izquierda" },
  { value: "bottom-right", label: "Inferior derecha" },
];

export default function WatermarkUpload() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [opacity, setOpacity] = useState(0.3);
  const [position, setPosition] = useState("center");
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
    if (!selectedFile || !text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await addWatermark(selectedFile, text.trim(), opacity, position);
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al añadir marca de agua");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPhase("upload");
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setText("");
    setOpacity(0.3);
    setPosition("center");
  }

  if (phase === "result") {
    const downloadName = result?.filename?.replace(/\.pdf$/i, "_con_marca.pdf");
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
            <a className="btn-download" href={getPdfDownloadUrl(result.id, downloadName)} download>
              Descargar PDF
            </a>
          )}
          {result?.status === "error" && (
            <span className="error-text" title={result.error_detail ?? ""}>{result.error_detail}</span>
          )}
          <span className={`status-dot ${result?.status}`} />
        </div>
        <div className="reset-container">
          <button className="btn-reset" onClick={handleReset}>Añadir otra marca</button>
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
              <label className="compress-label" htmlFor="watermark-text">Texto de la marca</label>
              <input
                id="watermark-text"
                type="text"
                className="split-text-input"
                placeholder="Ej: CONFIDENCIAL, BORRADOR"
                value={text}
                disabled={loading}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="compress-option">
              <label className="compress-label" htmlFor="watermark-opacity">
                Opacidad: <strong>{Math.round(opacity * 100)}%</strong>
              </label>
              <input
                id="watermark-opacity"
                type="range"
                className="compress-slider"
                min={5}
                max={90}
                step={5}
                value={Math.round(opacity * 100)}
                disabled={loading}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              />
              <div className="compress-slider-labels">
                <span>Sutil</span>
                <span>Intenso</span>
              </div>
            </div>

            <div className="compress-option">
              <label className="compress-label">Posición</label>
              {POSITIONS.map((p) => (
                <label key={p.value} className="split-option">
                  <input
                    type="radio"
                    name="position"
                    value={p.value}
                    checked={position === p.value}
                    disabled={loading}
                    onChange={() => setPosition(p.value)}
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="btn-upload" onClick={handleSubmit} disabled={loading || !text.trim()}>
            {loading ? "Añadiendo marca..." : "Añadir marca de agua"}
          </button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading && (
        <div className="loader-container">
          <div className="loader" />
          <span>Añadiendo marca de agua...</span>
        </div>
      )}
    </div>
  );
}
