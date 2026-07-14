import { useRef, useState } from "react";

interface SplitUploadProps {
  onUpload: (file: File, mode: string, everyN?: number, ranges?: string) => void;
  uploading: boolean;
}

export default function SplitUpload({ onUpload, uploading }: SplitUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState("all");
  const [everyN, setEveryN] = useState(2);
  const [ranges, setRanges] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const pdf = Array.from(files).find(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    if (pdf) setSelectedFile(pdf);
  }

  function removeFile() {
    setSelectedFile(null);
  }

  function handleSubmit() {
    if (!selectedFile) return;
    onUpload(selectedFile, mode, mode === "every" ? everyN : undefined, mode === "ranges" ? ranges : undefined);
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
        <p className="drop-text">
          Arrastra un PDF aquí o haz clic para seleccionarlo
        </p>
      </div>

      {selectedFile && (
        <div className="file-preview">
          <h3>Archivo seleccionado</h3>
          <ul className="file-list">
            <li>
              <span>{selectedFile.name}</span>
              <button type="button" className="btn-remove" onClick={removeFile} disabled={uploading}>
                ✕
              </button>
            </li>
          </ul>

          <div className="split-options">
            <label className="split-option">
              <input
                type="radio"
                name="split-mode"
                value="all"
                checked={mode === "all"}
                onChange={() => setMode("all")}
              />
              <span>Todas las páginas (una por PDF)</span>
            </label>

            <label className="split-option">
              <input
                type="radio"
                name="split-mode"
                value="every"
                checked={mode === "every"}
                onChange={() => setMode("every")}
              />
              <span>Cada </span>
              <input
                type="number"
                className="split-number-input"
                min={1}
                value={everyN}
                disabled={mode !== "every"}
                onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span> páginas</span>
            </label>

            <label className="split-option">
              <input
                type="radio"
                name="split-mode"
                value="ranges"
                checked={mode === "ranges"}
                onChange={() => setMode("ranges")}
              />
              <span>Rangos personalizados</span>
            </label>

            {mode === "ranges" && (
              <div className="split-ranges-input">
                <input
                  type="text"
                  className="split-text-input"
                  placeholder="Ej: 1-3, 5, 7-9"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                />
                <span className="split-hint">Ej: 1-3, 5, 7-9</span>
              </div>
            )}
          </div>

          <button className="btn-upload" onClick={handleSubmit} disabled={uploading || !selectedFile}>
            {uploading ? "Dividiendo..." : "Dividir PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
