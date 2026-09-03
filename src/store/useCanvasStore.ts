import { nanoid } from "nanoid";
import { create } from "zustand";

const DPI = 72;
const LOW_RES_THRESHOLD = 150; // dpi warning threshold
const PADDING = 16;

export type SheetPreset = "22x24" | "22x60" | "22x120";

export type CanvasImage = {
  id: string;
  groupId: string;
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  naturalWidth: number;
  naturalHeight: number;
  dpi: number;
};

export type CanvasState = {
  sheet: { width: number; height: number; preset: SheetPreset };
  images: CanvasImage[];
  selectedId: string | null;
  zoom: number;
  stagePosition: { x: number; y: number };
  snapToGrid: boolean;
  gridSize: number;
  setSheet: (preset: SheetPreset) => void;
  addImage: (img: Omit<CanvasImage, "id" | "dpi">) => void;
  updateImage: (id: string, data: Partial<CanvasImage>) => void;
  deleteImage: (id: string) => void;
  duplicateImage: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  setSelected: (id: string | null) => void;
  autoArrange: () => void;
  setZoom: (value: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;
  setSnapToGrid: (value: boolean) => void;
  setGridSize: (value: number) => void;
  setQuantity: (id: string, quantity: number) => void;
};

const presetToSize = (preset: SheetPreset) => {
  const [w, h] = preset.split("x").map(Number);
  return { width: w * DPI, height: h * DPI };
};

const computeDpi = (
  naturalWidth: number,
  naturalHeight: number,
  displayWidth: number,
  displayHeight: number,
) => {
  const displayWidthIn = displayWidth / DPI;
  const displayHeightIn = displayHeight / DPI;
  const dpiW = naturalWidth / displayWidthIn;
  const dpiH = naturalHeight / displayHeightIn;
  return Math.min(dpiW, dpiH);
};

export const useCanvasStore = create<CanvasState>((set) => ({
  sheet: { ...presetToSize("22x24"), preset: "22x24" },
  images: [],
  selectedId: null,
  zoom: 0.75,
  stagePosition: { x: 0, y: 0 },
  snapToGrid: true,
  gridSize: 12,

  setSheet: (preset) =>
    set(() => ({
      sheet: { ...presetToSize(preset), preset },
      selectedId: null,
      stagePosition: { x: 0, y: 0 },
    })),

  addImage: (img) =>
    set((state) => {
      const width = img.width;
      const height = img.height;
      const dpi = computeDpi(
        img.naturalWidth,
        img.naturalHeight,
        width,
        height,
      );
      const newImage: CanvasImage = {
        ...img,
        width,
        height,
        rotation: 0,
        dpi,
        id: nanoid(8),
        groupId: nanoid(6),
      };
      return {
        images: [...state.images, newImage],
        selectedId: newImage.id,
      };
    }),

  updateImage: (id, data) =>
    set((state) => {
      const images = state.images.map((img) => {
        if (img.id !== id) return img;
        const updated = { ...img, ...data };
        if (data.width || data.height) {
          const width = data.width ?? img.width;
          const height = data.height ?? img.height;
          updated.dpi = computeDpi(
            updated.naturalWidth,
            updated.naturalHeight,
            width,
            height,
          );
        }
        return updated;
      });
      return { images };
    }),

  deleteImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  duplicateImage: (id) =>
    set((state) => {
      const target = state.images.find((img) => img.id === id);
      if (!target) return state;
      const copy = {
        ...target,
        id: nanoid(8),
        groupId: target.groupId,
        x: target.x + 20,
        y: target.y + 20,
      };
      return {
        images: [...state.images, copy],
        selectedId: copy.id,
      };
    }),

  bringForward: (id) =>
    set((state) => {
      const idx = state.images.findIndex((img) => img.id === id);
      if (idx === -1 || idx === state.images.length - 1) return state;
      const images = [...state.images];
      [images[idx], images[idx + 1]] = [images[idx + 1], images[idx]];
      return { images };
    }),

  sendBackward: (id) =>
    set((state) => {
      const idx = state.images.findIndex((img) => img.id === id);
      if (idx <= 0) return state;
      const images = [...state.images];
      [images[idx - 1], images[idx]] = [images[idx], images[idx - 1]];
      return { images };
    }),

  setSelected: (id) => set(() => ({ selectedId: id })),

  autoArrange: () =>
    set((state) => {
      let cursorX = PADDING;
      let cursorY = PADDING;
      let rowHeight = 0;
      const maxWidth = state.sheet.width - PADDING;

      const arranged = state.images.map((img) => {
        if (cursorX + img.width > maxWidth) {
          cursorX = PADDING;
          cursorY += rowHeight + PADDING;
          rowHeight = 0;
        }
        const placed = { ...img, x: cursorX, y: cursorY };
        cursorX += img.width + PADDING;
        rowHeight = Math.max(rowHeight, img.height);
        return placed;
      });
      return { images: arranged };
    }),

  setZoom: (value) => set(() => ({ zoom: Math.min(Math.max(value, 0.2), 3) })),

  setStagePosition: (pos) => set(() => ({ stagePosition: pos })),

  setSnapToGrid: (value) => set(() => ({ snapToGrid: value })),

  setGridSize: (value) =>
    set(() => ({ gridSize: Math.min(Math.max(value, 4), 144) })),

  setQuantity: (id, quantity) =>
    set((state) => {
      const base = state.images.find((img) => img.id === id);
      if (!base) return state;
      const groupId = base.groupId;
      const group = state.images.filter((img) => img.groupId === groupId);
      const desired = Math.max(1, Math.round(quantity));

      if (desired === group.length) return state;

      if (desired < group.length) {
        const keep = state.images.filter((img) => {
          if (img.groupId !== groupId) return true;
          // keep first `desired` in group order
          const index = group.findIndex((g) => g.id === img.id);
          return index > -1 && index < desired;
        });
        return {
          images: keep,
          selectedId: keep.some((i) => i.id === state.selectedId)
            ? state.selectedId
            : (keep.find((i) => i.groupId === groupId)?.id ?? null),
        };
      }

      // need more copies
      const copiesNeeded = desired - group.length;
      const copies: CanvasImage[] = [];
      for (let i = 0; i < copiesNeeded; i++) {
        copies.push({
          ...base,
          id: nanoid(8),
          x: base.x + (i + 1) * PADDING,
          y: base.y + (i + 1) * PADDING,
        });
      }
      return {
        images: [...state.images, ...copies],
        selectedId: copies[0]?.id ?? state.selectedId,
      };
    }),
}));

export const dpiIsLow = (dpi: number) => dpi < LOW_RES_THRESHOLD;
export const dpiLabel = (dpi: number) => `${Math.round(dpi)} dpi`;
