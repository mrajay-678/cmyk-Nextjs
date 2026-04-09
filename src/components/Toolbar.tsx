"use client";

import styles from "@/styles/Toolbar.module.css";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useMemo } from "react";

type Props = {
  onExport: () => void;
  stagePixels: { width: number; height: number };
};

export default function Toolbar({ onExport, stagePixels }: Props) {
  const autoArrange = useCanvasStore((s) => s.autoArrange);
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setSheet = useCanvasStore((s) => s.setSheet);
  const sheet = useCanvasStore((s) => s.sheet);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const setSnapToGrid = useCanvasStore((s) => s.setSnapToGrid);
  const gridSize = useCanvasStore((s) => s.gridSize);
  const setGridSize = useCanvasStore((s) => s.setGridSize);

  const zoomLabel = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <span className={styles.label}>Sheet</span>
        <select
          value={sheet.preset}
          onChange={(e) => setSheet(e.target.value as any)}
        >
          <option value="22x24">22 x 24 in</option>
          <option value="22x60">22 x 60 in</option>
          <option value="22x120">22 x 120 in</option>
        </select>
      </div>

      <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={autoArrange}>
        Auto Arrange
      </button>

      <div className={styles.group}>
        <span className={styles.label}>Zoom</span>
        <input
          type="range"
          min={0.3}
          max={2}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className={styles.slider}
        />
        <span>{zoomLabel}</span>
      </div>

      <button className={styles.button} onClick={onExport}>
        Export PNG (2x)
      </button>

      <div className={styles.group}>
        <span className={styles.label}>Canvas</span>
        <span>
          {Math.round(stagePixels.width)}px × {Math.round(stagePixels.height)}px
        </span>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
          />{" "}
          Snap
        </label>
        <input
          type="number"
          min={4}
          max={144}
          value={gridSize}
          onChange={(e) => setGridSize(Number(e.target.value))}
          className={styles.number}
        />
        <span className={styles.label}>px step</span>
      </div>
    </div>
  );
}
