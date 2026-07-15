import { useRef, useState } from "react";

interface MergeUploadProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
}

export default function MergeUpload({ onUpload, uploading }: MergeUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type.startsWith("image/") ||
        /\.(pdf|jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(f.name)
    );
    setSelectedFiles((prev) => [...prev, ...valid]);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (selectedFiles.length === 0) return;
    onUpload(selectedFiles);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div
        className={`border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer bg-card transition-colors hover:border-primary ${dragOver ? "border-primary bg-primary-light" : ""}`}
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

      {selectedFiles.length > 0 && (
        <div className="mt-4 bg-card border border-border rounded-xl p-4">
          <h3 className="text-md font-semibold mb-2">{selectedFiles.length} archivo(s) seleccionado(s)</h3>
          <ul className="space-y-2">
            {selectedFiles.map((file, i) => (
              <li key={i} className="flex justify-between items-center py-1.5 border-b border-border last:border-b-0 text-sm">
                <span>{file.name}</span>
                <button type="button" className="text-error bg-transparent border-none cursor-pointer text-lg p-0.5 hover:text-red-700" onClick={() => removeFile(i)} disabled={uploading}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-5 py-2 transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed mt-3" onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Uniendo..." : "Unir y descargar PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
