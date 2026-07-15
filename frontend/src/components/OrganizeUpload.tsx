import { useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { organizeUpload, organizeApply, organizeCleanup, getThumbnailUrl } from "../api/client";
import type { UploadResult, PageOp } from "../api/client";

interface OrganizePage {
  id: string;
  originalPage: number;
  rotate: number;
}

type Phase = "upload" | "grid" | "result";

export default function OrganizeUpload() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState("");
  const [pages, setPages] = useState<OrganizePage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const pdf = Array.from(files).find(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    if (pdf) setSelectedFile(pdf);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const data = await organizeUpload(selectedFile);
      setFileId(data.id!);
      setOriginalName(data.filename);
      setPages(
        Array.from({ length: data.page_count }, (_, i) => ({
          id: String(i + 1),
          originalPage: i + 1,
          rotate: 0,
        })),
      );
      setPhase("grid");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el PDF");
    } finally {
      setUploading(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleRotate(id: string) {
    setPages((items) =>
      items.map((p) =>
        p.id === id ? { ...p, rotate: (p.rotate + 90) % 360 } : p,
      ),
    );
  }

  function handleDelete(id: string) {
    setPages((items) => items.filter((p) => p.id !== id));
  }

  async function handleApply() {
    if (!fileId) return;
    setSaving(true);
    setError(null);
    try {
      const pageOps: PageOp[] = pages.map((p) => ({
        page: p.originalPage,
        rotate: p.rotate,
      }));
      const data = await organizeApply(fileId, pageOps);
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al aplicar cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (fileId) {
      organizeCleanup(fileId).catch(() => {});
    }
    setPhase("upload");
    setFileId(null);
    setOriginalName("");
    setPages([]);
    setResult(null);
    setError(null);
    setSelectedFile(null);
  }

  if (phase === "grid") {
    return (
      <div className="organize-container">
        <div className="organize-toolbar">
          <span className="organize-toolbar-info">
            {pages.length} página{pages.length !== 1 ? "s" : ""}
            {pages.length < (fileId ? pages.length : 0) && (
              <span className="organize-toolbar-deleted">
                {" "}
                (se eliminaron {result?.page_count
                  ? result.page_count - pages.length
                  : 0})
              </span>
            )}
          </span>
          <button className="btn-reset" onClick={handleReset} disabled={saving}>
            Volver
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pages.map((p) => p.id)}>
            <div className="organize-grid">
              {pages.map((page) => (
                <SortableThumbnail
                  key={page.id}
                  page={page}
                  fileId={fileId!}
                  onRotate={handleRotate}
                  onDelete={handleDelete}
                  disabled={saving}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {error && <div className="error-banner">{error}</div>}

        {saving && (
          <div className="loader-container">
            <div className="loader" />
            <span>Organizando páginas...</span>
          </div>
        )}

        <div className="organize-actions">
          <button className="btn-upload" onClick={handleApply} disabled={saving || pages.length === 0}>
            {saving ? "Guardando..." : "Aplicar cambios y descargar"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="organize-container">
        <div className="file-row status-completed">
          <div className="file-info">
            <span className="file-name">{originalName}</span>
            {result?.status === "completed" && (
              <span className="badge">{result.page_count} páginas</span>
            )}
          </div>
          <div className="file-actions">
            {result?.status === "completed" && result?.id && (
              <a
                className="btn-download"
                href={`/api/download-pdf/${result.id}?name=${encodeURIComponent(originalName.replace(/\.pdf$/i, "_organizado.pdf"))}`}
                download
              >
                Descargar PDF
              </a>
            )}
            <span className="status-dot completed" />
          </div>
        </div>
        <div className="reset-container">
          <button className="btn-reset" onClick={handleReset}>
            Organizar otro PDF
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
              <button type="button" className="btn-remove" onClick={() => setSelectedFile(null)} disabled={uploading}>
                ✕
              </button>
            </li>
          </ul>
          <button className="btn-upload" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir PDF"}
          </button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      {uploading && (
        <div className="loader-container">
          <div className="loader" />
          <span>Procesando PDF...</span>
        </div>
      )}
    </div>
  );
}

/* ───── Sortable thumbnail item ───── */

interface SortableThumbnailProps {
  page: OrganizePage;
  fileId: string;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}

function SortableThumbnail({ page, fileId, onRotate, onDelete, disabled }: SortableThumbnailProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="organize-thumb">
      <div className="organize-thumb-handle" {...attributes} {...listeners}>
        <span className="organize-thumb-drag">⠿</span>
      </div>
      <div className="organize-thumb-image-wrap">
        <img
          src={getThumbnailUrl(fileId, page.originalPage)}
          alt={`Página ${page.originalPage}`}
          loading="lazy"
          className="organize-thumb-img"
          style={{ transform: `rotate(${page.rotate}deg)` }}
        />
      </div>
      <div className="organize-thumb-footer">
        <span className="organize-thumb-page">Pág. {page.originalPage}</span>
        {page.rotate > 0 && <span className="organize-thumb-rotate-badge">{page.rotate}°</span>}
        <div className="organize-thumb-actions">
          <button
            type="button"
            className="organize-btn-icon"
            onClick={() => onRotate(page.id)}
            disabled={disabled}
            title="Rotar 90°"
          >
            ↻
          </button>
          <button
            type="button"
            className="organize-btn-icon organize-btn-delete"
            onClick={() => onDelete(page.id)}
            disabled={disabled}
            title="Eliminar página"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
