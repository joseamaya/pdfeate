import { useRef, useState } from "react";

interface CompressUploadProps {
  onUpload: (file: File, quality: number, reduceDpi: boolean) => void;
  uploading: boolean;
}

export default function CompressUpload({ onUpload, uploading }: CompressUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(60);
  const [reduceDpi, setReduceDpi] = useState(true);
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
    onUpload(selectedFile, quality, reduceDpi);
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

          <div className="compress-options">
            <div className="compress-option">
              <label className="compress-label" htmlFor="quality-slider">
                Calidad: <strong>{quality}%</strong>
              </label>
              <input
                id="quality-slider"
                type="range"
                className="compress-slider"
                min={10}
                max={90}
                step={5}
                value={quality}
                disabled={uploading}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <div className="compress-slider-labels">
                <span>Más compresión</span>
                <span>Más calidad</span>
              </div>
            </div>

            <label className="compress-option compress-checkbox">
              <input
                type="checkbox"
                checked={reduceDpi}
                disabled={uploading}
                onChange={(e) => setReduceDpi(e.target.checked)}
              />
              <span>Reducir resolución (150 DPI)</span>
            </label>
          </div>

          <button className="btn-upload" onClick={handleSubmit} disabled={uploading || !selectedFile}>
            {uploading ? "Comprimiendo..." : "Comprimir PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
