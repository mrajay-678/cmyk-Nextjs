"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/UploadPanel.module.css";
import { useCanvasStore } from "@/store/useCanvasStore";

type Thumb = { src: string; dpi: number; name: string };

export default function UploadPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const addImage = useCanvasStore((s) => s.addImage);
  const sheetWidth = useCanvasStore((s) => s.sheet.width);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => {
      if (file.type !== "image/png") return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const maxWidth = Math.min(img.width, sheetWidth / 2);
        const scale = maxWidth / img.width;
        const width = img.width * scale;
        const height = img.height * scale;
        addImage({
          src: url,
          width,
          height,
          x: 24,
          y: 24,
          rotation: 0,
          naturalWidth: img.width,
          naturalHeight: img.height,
        });
        const displayWidthIn = width / 72;
        const dpi = img.width / displayWidthIn;
        setThumbs((prev) => [...prev, { src: url, dpi, name: file.name }]);
      };
      img.src = url;
    });
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handler = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", handler);
    window.addEventListener("drop", handler);
    return () => {
      window.removeEventListener("dragover", handler);
      window.removeEventListener("drop", handler);
    };
  }, []);

  return (
    <div className={styles.panel}>
      <div
        className={styles.drop}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer?.files ?? null);
        }}
      >
        <strong>Drag &amp; drop PNGs</strong>
        <div>or click to browse (multiple allowed)</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {thumbs.length > 0 && (
        <div className={styles.thumbs}>
          {thumbs.map((thumb) => (
            <div key={thumb.src} className={styles.thumb}>
              <img src={thumb.src} alt={thumb.name} />
              <div className={styles.badge}>
                {Math.round(thumb.dpi)} dpi
                {thumb.dpi < 150 ? " (low)" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
