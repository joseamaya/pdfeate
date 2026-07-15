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

          <div className="space-y-3 mt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="split-mode"
                value="all"
                checked={mode === "all"}
                onChange={() => setMode("all")}
              />
              <span>Todas las páginas (una por PDF)</span>
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
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
                className="w-16 p-1 border border-border rounded text-sm text-center"
                min={1}
                value={everyN}
                disabled={mode !== "every"}
                onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span> páginas</span>
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
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
              <div className="mt-2 space-y-1">
                <input
                  type="text"
                  className="w-full p-2 border border-border rounded-md text-sm"
                  placeholder="Ej: 1-3, 5, 7-9"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                />
                <span className="text-xs text-text-secondary">Ej: 1-3, 5, 7-9</span>
              </div>
            )}
          </div>

          <button className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-5 py-2 transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed mt-4" onClick={handleSubmit} disabled={uploading || !selectedFile}>
            {uploading ? "Dividiendo..." : "Dividir PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
