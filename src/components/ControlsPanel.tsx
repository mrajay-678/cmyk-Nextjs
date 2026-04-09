"use client";

import styles from "@/styles/ControlsPanel.module.css";
import {
  dpiIsLow,
  dpiLabel,
  useCanvasStore,
} from "@/store/useCanvasStore";

export default function ControlsPanel() {
  const selectedId = useCanvasStore((s) => s.selectedId);
  const image = useCanvasStore((s) =>
    s.images.find((img) => img.id === s.selectedId),
  );
  const updateImage = useCanvasStore((s) => s.updateImage);
  const deleteImage = useCanvasStore((s) => s.deleteImage);
  const duplicateImage = useCanvasStore((s) => s.duplicateImage);
  const bringForward = useCanvasStore((s) => s.bringForward);
  const sendBackward = useCanvasStore((s) => s.sendBackward);
  const setQuantity = useCanvasStore((s) => s.setQuantity);
  const groupQuantity = useCanvasStore(
    (s) => image && s.images.filter((img) => img.groupId === image.groupId).length,
  );

  if (!selectedId || !image) {
    return (
      <div className={styles.panel}>
        <div className={styles.label}>Select an element to edit</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.label}>Item</span>
        <span className={styles.value}>{selectedId}</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Size</span>
        <span className={styles.value}>
          {Math.round(image.width)} × {Math.round(image.height)} px
        </span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Rotation</span>
        <input
          className={styles.slider}
          type="range"
          min={-180}
          max={180}
          step={1}
          value={image.rotation}
          onChange={(e) =>
            updateImage(image.id, { rotation: Number(e.target.value) })
          }
        />
        <span>{Math.round(image.rotation)}°</span>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Width (px)</span>
        <input
          type="number"
          value={Math.round(image.width)}
          onChange={(e) =>
            updateImage(image.id, {
              width: Math.max(10, Number(e.target.value)),
            })
          }
        />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Height (px)</span>
        <input
          type="number"
          value={Math.round(image.height)}
          onChange={(e) =>
            updateImage(image.id, {
              height: Math.max(10, Number(e.target.value)),
            })
          }
        />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Quantity</span>
        <input
          type="number"
          min={1}
          value={groupQuantity ?? 1}
          onChange={(e) => setQuantity(image.id, Number(e.target.value))}
        />
      </div>

      <div className={styles.row}>
        <span className={styles.label}>DPI</span>
        <span className={dpiIsLow(image.dpi) ? styles.warn : styles.value}>
          {dpiLabel(image.dpi)}
        </span>
      </div>

      <div className={styles.buttons}>
        <button className={styles.button} onClick={() => duplicateImage(image.id)}>
          Duplicate
        </button>
        <button className={styles.button} onClick={() => bringForward(image.id)}>
          Bring forward
        </button>
        <button className={styles.button} onClick={() => sendBackward(image.id)}>
          Send backward
        </button>
        <button className={styles.button} onClick={() => deleteImage(image.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
