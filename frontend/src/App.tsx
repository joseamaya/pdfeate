import { useState } from "react";
import FileUpload from "./components/FileUpload";
import FileList from "./components/FileList";
import MergeUpload from "./components/MergeUpload";
import MergeResult from "./components/MergeResult";
import SplitUpload from "./components/SplitUpload";
import SplitResult from "./components/SplitResult";
import CompressUpload from "./components/CompressUpload";
import CompressResult from "./components/CompressResult";
import type { UploadResult } from "./api/client";
import { uploadPdfs, mergeUpload, splitPdf, compressPdf } from "./api/client";
import "./App.css";

export default function App() {
  const [results, setResults] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<UploadResult | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [splitResult, setSplitResult] = useState<UploadResult | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressResult, setCompressResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [compressError, setCompressError] = useState<string | null>(null);

  async function handleUpload(files: File[]) {
    setUploading(true);
    setError(null);
    try {
      const data = await uploadPdfs(files);
      setResults((prev) => [...prev, ...data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir los archivos");
    } finally {
      setUploading(false);
    }
  }

  async function handleMerge(files: File[]) {
    setMerging(true);
    setMergeError(null);
    setMergeResult(null);
    try {
      const data = await mergeUpload(files);
      setMergeResult(data);
    } catch (err) {
      setMergeError(err instanceof Error ? err.message : "Error al unir los archivos");
    } finally {
      setMerging(false);
    }
  }

  async function handleSplit(file: File, mode: string, everyN?: number, ranges?: string) {
    setSplitting(true);
    setSplitError(null);
    setSplitResult(null);
    try {
      const data = await splitPdf(file, mode, everyN, ranges);
      setSplitResult(data);
    } catch (err) {
      setSplitError(err instanceof Error ? err.message : "Error al dividir el PDF");
    } finally {
      setSplitting(false);
    }
  }

  async function handleCompress(file: File, quality: number, reduceDpi: boolean) {
    setCompressing(true);
    setCompressError(null);
    setCompressResult(null);
    try {
      const data = await compressPdf(file, quality, reduceDpi);
      setCompressResult(data);
    } catch (err) {
      setCompressError(err instanceof Error ? err.message : "Error al comprimir el PDF");
    } finally {
      setCompressing(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>PDFeate</h1>
        <p>Sube PDFs e imágenes para convertirlos, unirlos o dividirlos</p>
      </header>

      <section className="section">
        <h2 className="section-title">Unir PDFs e imágenes</h2>
        <p className="section-desc">Sube archivos en cualquier orden y obtén un único PDF con todas las páginas</p>

        <MergeUpload onUpload={handleMerge} uploading={merging} />

        {mergeError && <div className="error-banner">{mergeError}</div>}

        {merging && (
          <div className="loader-container">
            <div className="loader" />
            <span>Uniendo archivos...</span>
          </div>
        )}

        <MergeResult result={mergeResult} />

        {mergeResult && (
          <div className="reset-container">
            <button className="btn-reset" onClick={() => setMergeResult(null)}>
              Limpiar
            </button>
          </div>
        )}
      </section>

      <hr className="section-divider" />

      <section className="section">
        <h2 className="section-title">Dividir PDF</h2>
        <p className="section-desc">Divide un PDF en varios archivos separados por página, grupos o rangos</p>

        <SplitUpload onUpload={handleSplit} uploading={splitting} />

        {splitError && <div className="error-banner">{splitError}</div>}

        {splitting && (
          <div className="loader-container">
            <div className="loader" />
            <span>Dividiendo PDF...</span>
          </div>
        )}

        <SplitResult result={splitResult} />

        {splitResult && (
          <div className="reset-container">
            <button className="btn-reset" onClick={() => setSplitResult(null)}>
              Limpiar
            </button>
          </div>
        )}
      </section>

      <hr className="section-divider" />

      <section className="section">
        <h2 className="section-title">Comprimir PDF</h2>
        <p className="section-desc">Reduce el tamaño del PDF ajustando la calidad de imagen y resolución</p>

        <CompressUpload onUpload={handleCompress} uploading={compressing} />

        {compressError && <div className="error-banner">{compressError}</div>}

        {compressing && (
          <div className="loader-container">
            <div className="loader" />
            <span>Comprimiendo PDF...</span>
          </div>
        )}

        <CompressResult result={compressResult} />

        {compressResult && (
          <div className="reset-container">
            <button className="btn-reset" onClick={() => setCompressResult(null)}>
              Limpiar
            </button>
          </div>
        )}
      </section>

      <hr className="section-divider" />

      <section className="section">
        <h2 className="section-title">Convertir PDF a JPG</h2>
        <p className="section-desc">Convierte cada página de un PDF a imágenes JPG y descarga como ZIP</p>

        <FileUpload onUpload={handleUpload} uploading={uploading} />

        {error && <div className="error-banner">{error}</div>}

        {uploading && (
          <div className="loader-container">
            <div className="loader" />
            <span>Procesando PDFs...</span>
          </div>
        )}

        <FileList results={results} />

        {results.length > 0 && (
          <div className="reset-container">
            <button className="btn-reset" onClick={() => setResults([])}>
              Limpiar todo
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
