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
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div
        className={`border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer bg-card transition-colors hover:border-primary ${dragOver ? "border-primary bg-primary-light" : ""}`}
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
        <p className="text-text-secondary">
          Arrastra un PDF aquí o haz clic para seleccionarlo
        </p>
      </div>

      {selectedFile && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <h3 className="text-md font-semibold mb-2">Archivo seleccionado</h3>
          <ul className="space-y-2">
            <li className="flex justify-between items-center py-1.5 border-b border-border last:border-b-0 text-sm">
              <span>{selectedFile.name}</span>
              <button type="button" className="text-error bg-transparent border-none cursor-pointer text-lg p-0.5 hover:text-red-700" onClick={removeFile} disabled={uploading}>
                ✕
              </button>
            </li>
          </ul>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-text mb-1" htmlFor="quality-slider">
                Calidad: <strong>{quality}%</strong>
              </label>
              <input
                id="quality-slider"
                type="range"
                className="w-full accent-primary cursor-pointer disabled:opacity-50"
                min={10}
                max={90}
                step={5}
                value={quality}
                disabled={uploading}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>Más compresión</span>
                <span>Más calidad</span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="accent-primary"
                checked={reduceDpi}
                disabled={uploading}
                onChange={(e) => setReduceDpi(e.target.checked)}
              />
              <span>Reducir resolución (150 DPI)</span>
            </label>
          </div>

          <button className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-5 py-2 transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed mt-4" onClick={handleSubmit} disabled={uploading || !selectedFile}>
            {uploading ? "Comprimiendo..." : "Comprimir PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
