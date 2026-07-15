import { useState, useCallback, useRef } from "react";

interface UseFileUploadOptions {
  accept?: string;
  validate?: (file: File) => boolean;
  multiple?: boolean;
}

export function useFileUpload({ accept, validate, multiple = false }: UseFileUploadOptions = {}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const valid = Array.from(files).filter((f) => !validate || validate(f));
      setSelectedFiles((prev) => (multiple ? [...prev, ...valid] : valid.slice(0, 1)));
    },
    [validate, multiple],
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  return {
    selectedFiles,
    dragOver,
    inputRef,
    setDragOver,
    handleFiles,
    removeFile,
    clearFiles,
    setSelectedFiles,
    accept,
  };
}
