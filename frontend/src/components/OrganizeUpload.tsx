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
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-text-secondary">
            {pages.length} página{pages.length !== 1 ? "s" : ""}
            {pages.length < (fileId ? pages.length : 0) && (
              <span className="text-error">
                {" "}
                (se eliminaron {result?.page_count
                  ? result.page_count - pages.length
                  : 0})
              </span>
            )}
          </span>
          <button className="bg-border text-text rounded-md text-sm font-medium cursor-pointer px-4 py-2 transition-colors hover:bg-stone-300" onClick={handleReset} disabled={saving}>
            Volver
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pages.map((p) => p.id)}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-4">
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

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-error text-sm">{error}</div>}

        {saving && (
          <div className="flex items-center justify-center gap-3 mt-6 text-text-secondary text-sm">
            <div className="w-5 h-5 border-3 border-border border-t-primary rounded-full animate-spin" />
            <span>Organizando páginas...</span>
          </div>
        )}

        <div className="mt-4">
          <button className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-5 py-2 transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleApply} disabled={saving || pages.length === 0}>
            {saving ? "Guardando..." : "Aplicar cambios y descargar"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center bg-card border border-border rounded-xl p-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">{originalName}</span>
            {result?.status === "completed" && (
              <span className="inline-block bg-primary-light text-primary text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">{result.page_count} páginas</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {result?.status === "completed" && result?.id && (
              <a
                className="bg-success text-white rounded-md text-sm font-medium cursor-pointer px-4 py-2 no-underline transition-colors hover:bg-green-700 inline-block"
                href={`/api/download-pdf/${result.id}?name=${encodeURIComponent(originalName.replace(/\.pdf$/i, "_organizado.pdf"))}`}
                download
              >
                Descargar PDF
              </a>
            )}
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-success" />
          </div>
        </div>
        <div className="mt-4 text-center">
          <button className="bg-border text-text rounded-md text-sm font-medium cursor-pointer px-4 py-2 transition-colors hover:bg-stone-300" onClick={handleReset}>
            Organizar otro PDF
          </button>
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
              <button type="button" className="text-error bg-transparent border-none cursor-pointer text-lg p-0.5 hover:text-red-700" onClick={() => setSelectedFile(null)} disabled={uploading}>
                ✕
              </button>
            </li>
          </ul>
          <button className="bg-primary text-white rounded-md text-sm font-medium cursor-pointer px-5 py-2 transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed mt-3" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir PDF"}
          </button>
        </div>
      )}

      {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-error text-sm">{error}</div>}

      {uploading && (
        <div className="flex items-center justify-center gap-3 mt-6 text-text-secondary text-sm">
          <div className="w-5 h-5 border-3 border-border border-t-primary rounded-full animate-spin" />
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
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="cursor-grab active:cursor-grabbing px-2 py-1 bg-stone-100 border-b border-border flex items-center select-none" {...attributes} {...listeners}>
        <span>⠿</span>
      </div>
      <div className="p-2 flex justify-center items-center bg-bg min-h-36">
        <img
          src={getThumbnailUrl(fileId, page.originalPage)}
          alt={`Página ${page.originalPage}`}
          loading="lazy"
          className="max-w-full max-h-full object-contain"
          style={{ transform: `rotate(${page.rotate}deg)` }}
        />
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-t border-border text-xs bg-stone-100">
        <span className="font-medium text-text shrink-0">Pág. {page.originalPage}</span>
        {page.rotate > 0 && <span className="text-[0.65rem] bg-primary text-white px-1 py-0.5 rounded shrink-0">{page.rotate}°</span>}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            className="bg-transparent border border-border rounded cursor-pointer text-sm px-1 py-0.5 text-text-secondary transition-colors hover:bg-card hover:text-text disabled:opacity-40 disabled:cursor-not-allowed leading-none"
            onClick={() => onRotate(page.id)}
            disabled={disabled}
            title="Rotar 90°"
          >
            ↻
          </button>
          <button
            type="button"
            className="bg-transparent border border-border rounded cursor-pointer text-sm px-1 py-0.5 text-text-secondary transition-colors hover:bg-card hover:text-text disabled:opacity-40 disabled:cursor-not-allowed leading-none hover:text-error hover:border-error"
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
