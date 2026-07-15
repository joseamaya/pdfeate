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
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center bg-card border border-border rounded-xl p-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">{result?.filename}</span>
            {result?.status === "completed" && (
              <span className="inline-block bg-primary-light text-primary text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">{result.page_count} páginas</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {result?.status === "completed" && result?.id && (
              <a className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-colors hover:bg-green-700 inline-block" href={getPdfDownloadUrl(result.id, downloadName)} download>
                Descargar PDF
              </a>
            )}
            {result?.status === "error" && (
              <span className="text-error text-xs max-w-40 truncate" title={result.error_detail ?? ""}>{result.error_detail}</span>
            )}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${result?.status === "completed" ? "bg-success" : "bg-error"}`} />
          </div>
        </div>
        <div className="mt-4 text-center">
          <button className="bg-border text-text rounded-md text-sm font-medium cursor-pointer px-4 py-2 transition-colors hover:bg-stone-300" onClick={handleReset}>Añadir otra marca</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div
        className={`border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer bg-card transition-colors hover:border-primary ${dragOver ? "border-primary bg-primary-light" : ""}`}
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
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <h3 className="text-md font-semibold mb-2">Archivo seleccionado</h3>
          <ul className="space-y-2">
            <li className="flex justify-between items-center py-1.5 border-b border-border last:border-b-0 text-sm">
              <span>{selectedFile.name}</span>
              <button type="button" className="text-error bg-transparent border-none cursor-pointer text-lg p-0.5 hover:text-red-700" onClick={() => setSelectedFile(null)} disabled={loading}>✕</button>
            </li>
          </ul>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-text mb-1" htmlFor="watermark-text">Texto de la marca</label>
              <input
                id="watermark-text"
                type="text"
                className="w-full p-2 border border-border rounded-md text-sm"
                placeholder="Ej: CONFIDENCIAL, BORRADOR"
                value={text}
                disabled={loading}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-text mb-1" htmlFor="watermark-opacity">
                Opacidad: <strong>{Math.round(opacity * 100)}%</strong>
              </label>
              <input
                id="watermark-opacity"
                type="range"
                className="w-full accent-primary cursor-pointer disabled:opacity-50"
                min={5}
                max={90}
                step={5}
                value={Math.round(opacity * 100)}
                disabled={loading}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>Sutil</span>
                <span>Intenso</span>
              </div>
            </div>

            <div>
              <span className="block text-sm text-text mb-1">Posición</span>
              {POSITIONS.map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer">
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

          <button className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-5 py-2 transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed mt-4" onClick={handleSubmit} disabled={loading || !text.trim()}>
            {loading ? "Añadiendo marca..." : "Añadir marca de agua"}
          </button>
        </div>
      )}

      {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-error text-sm">{error}</div>}
      {loading && (
        <div className="flex items-center justify-center gap-3 mt-6 text-text-secondary text-sm">
          <div className="w-5 h-5 border-3 border-border border-t-primary rounded-full animate-spin" />
          <span>Añadiendo marca de agua...</span>
        </div>
      )}
    </div>
  );
}
