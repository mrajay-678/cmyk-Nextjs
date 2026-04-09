"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  Group,
  Layer,
  Line,
  Rect,
  Stage,
  Transformer,
  Image as RImage,
} from "react-konva";
import type Konva from "konva";
import styles from "@/styles/CanvasEditor.module.css";
import {
  CanvasImage,
  useCanvasStore,
} from "@/store/useCanvasStore";

type Props = {
  stageRef: MutableRefObject<Konva.Stage | null>;
};

const SAFE_MARGIN = 24;

const useLoadImage = (src: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = src;
    return () => {
      setImage(null);
    };
  }, [src]);
  return image;
};

type ImageNodeProps = {
  item: CanvasImage;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CanvasImage>) => void;
  transformerRef: React.MutableRefObject<Konva.Transformer | null>;
  snapToGrid: boolean;
  gridSize: number;
};

function ImageNode({
  item,
  isSelected,
  onSelect,
  onChange,
  transformerRef,
  snapToGrid,
  gridSize,
}: ImageNodeProps) {
  const image = useLoadImage(item.src);
  const shapeRef = useRef<Konva.Image | null>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, transformerRef]);

  return (
    <>
      <RImage
        ref={shapeRef}
        image={image ?? undefined}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          const nx = snapToGrid
            ? Math.round(e.target.x() / gridSize) * gridSize
            : e.target.x();
          const ny = snapToGrid
            ? Math.round(e.target.y() / gridSize) * gridSize
            : e.target.y();
          onChange({ x: nx, y: ny });
        }}
        onTransformEnd={() => {
          if (!shapeRef.current) return;
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const newWidth = Math.max(5, node.width() * scaleX);
          const newHeight = Math.max(5, node.height() * scaleY);
          node.scaleX(1);
          node.scaleY(1);
          const snappedX = snapToGrid
            ? Math.round(node.x() / gridSize) * gridSize
            : node.x();
          const snappedY = snapToGrid
            ? Math.round(node.y() / gridSize) * gridSize
            : node.y();
          const snappedW = snapToGrid
            ? Math.round(newWidth / gridSize) * gridSize
            : newWidth;
          const snappedH = snapToGrid
            ? Math.round(newHeight / gridSize) * gridSize
            : newHeight;
          onChange({
            width: snappedW,
            height: snappedH,
            rotation: node.rotation(),
            x: snappedX,
            y: snappedY,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          keepRatio={false}
          padding={6}
          anchorStroke="#ef2987"
          borderStroke="#ef2987"
        />
      )}
    </>
  );
}

export default function CanvasEditor({ stageRef }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [size, setSize] = useState({ width: 960, height: 720 });

  const sheet = useCanvasStore((s) => s.sheet);
  const images = useCanvasStore((s) => s.images);
  const selectedId = useCanvasStore((s) => s.selectedId);
  const setSelected = useCanvasStore((s) => s.setSelected);
  const updateImage = useCanvasStore((s) => s.updateImage);
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const stagePosition = useCanvasStore((s) => s.stagePosition);
  const setStagePosition = useCanvasStore((s) => s.setStagePosition);
  const snapToGrid = useCanvasStore((s) => s.snapToGrid);
  const gridSize = useCanvasStore((s) => s.gridSize);

  const centerOffset = useMemo(
    () => ({
      x: (size.width - sheet.width * zoom) / 2,
      y: (size.height - sheet.height * zoom) / 2,
    }),
    [size.width, size.height, sheet.width, sheet.height, zoom],
  );

  useEffect(() => {
    if (!transformerRef.current) return;
    if (!selectedId) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height: Math.max(640, height) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setZoom(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePosition({
      x: newPos.x - centerOffset.x,
      y: newPos.y - centerOffset.y,
    });
  };

  const gridLines = useMemo(() => {
    const lines: { points: number[] }[] = [];
    const step = 72; // 1 inch grid
    for (let x = 0; x <= sheet.width; x += step) {
      lines.push({ points: [x, 0, x, sheet.height] });
    }
    for (let y = 0; y <= sheet.height; y += step) {
      lines.push({ points: [0, y, sheet.width, y] });
    }
    return lines;
  }, [sheet.width, sheet.height]);

  return (
    <div className={styles.canvasShell} ref={containerRef}>
      <div className={styles.stage}>
        <Stage
          ref={(node) => {
            stageRef.current = node;
          }}
          width={size.width}
          height={size.height}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePosition.x + centerOffset.x}
          y={stagePosition.y + centerOffset.y}
          draggable
          onDragEnd={(e) =>
            setStagePosition({
              x: e.target.x() - centerOffset.x,
              y: e.target.y() - centerOffset.y,
            })
          }
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              setSelected(null);
            }
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) setSelected(null);
          }}
          onWheel={handleWheel}
        >
          <Layer>
            <Group x={0} y={0}>
              <Rect
                x={0}
                y={0}
                width={sheet.width}
                height={sheet.height}
                fill="#fff"
                stroke="#d7cde8"
                cornerRadius={8}
              />
              {gridLines.map((line, idx) => (
                <Line
                  key={idx}
                  points={line.points}
                  stroke="#ede8f5"
                  strokeWidth={1}
                />
              ))}
              <Rect
                x={SAFE_MARGIN}
                y={SAFE_MARGIN}
                width={sheet.width - SAFE_MARGIN * 2}
                height={sheet.height - SAFE_MARGIN * 2}
                stroke="#c9bddc"
                dash={[10, 6]}
                cornerRadius={8}
              />

              {images.map((img) => (
                <ImageNode
                  key={img.id}
                  item={img}
                  isSelected={img.id === selectedId}
                  onSelect={() => setSelected(img.id)}
                  onChange={(attrs) => updateImage(img.id, attrs)}
                  transformerRef={transformerRef}
                  snapToGrid={snapToGrid}
                  gridSize={gridSize}
                />
              ))}
            </Group>
          </Layer>
        </Stage>
      </div>
      <div className={styles.meta}>
        Sheet: {sheet.width / 72}" × {sheet.height / 72}" • Zoom {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
