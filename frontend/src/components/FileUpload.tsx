import { useRef, useState } from "react";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  uploading: boolean;
}

export default function FileUpload({ onUpload, uploading }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const pdfs = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    setSelectedFiles((prev) => [...prev, ...pdfs]);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (selectedFiles.length === 0) return;
    onUpload(selectedFiles);
  }

  return (
    <div className="upload-section">
      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          ref={inputRef}
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="drop-text">
          Arrastra los PDFs aquí o haz clic para seleccionarlos
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="file-preview">
          <h3>{selectedFiles.length} archivo(s) seleccionado(s)</h3>
          <ul className="file-list">
            {selectedFiles.map((file, i) => (
              <li key={i}>
                <span>{file.name}</span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeFile(i)}
                  disabled={uploading}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <button
            className="btn-upload"
            onClick={handleSubmit}
            disabled={uploading}
          >
            {uploading ? "Subiendo..." : "Subir y convertir"}
          </button>
        </div>
      )}
    </div>
  );
}
