import QRCode from "qrcode";

import type { DotStyle, errorCorrectionLevels } from "@/lib/qr-schema";

type Level = (typeof errorCorrectionLevels)[number];

export type QrImageSettings = {
  src: string;
  height?: number;
  width?: number;
  excavate?: boolean;
  x?: number;
  y?: number;
  opacity?: number;
};

export type QrModule = { row: number; col: number };
export type QrFinderOrigin = { row: number; col: number };

export type QrImageLayout = { x: number; y: number; w: number; h: number; opacity: number };

export type QrLayout = {
  numCells: number;
  margin: number;
  modules: QrModule[];
  finderOrigins: QrFinderOrigin[];
  image: QrImageLayout | null;
};

const DEFAULT_IMG_SCALE = 0.1;
export const FINDER_SIZE = 7;

function isFinderRegion(row: number, col: number, moduleCount: number): boolean {
  return (
    (row < 7 && col < 7) ||
    (row < 7 && col >= moduleCount - 7) ||
    (row >= moduleCount - 7 && col < 7)
  );
}

export function buildQrLayout(params: {
  value: string;
  level: Level;
  size: number;
  margin: number;
  imageSettings?: QrImageSettings;
}): QrLayout {
  const { value, level, size, margin, imageSettings } = params;
  const qr = QRCode.create(value, { errorCorrectionLevel: level });
  const moduleCount = qr.modules.size;
  const numCells = moduleCount + margin * 2;

  let image: QrImageLayout | null = null;
  let excavateX = 0;
  let excavateY = 0;
  let excavateW = 0;
  let excavateH = 0;
  let hasExcavation = false;

  if (imageSettings) {
    const scale = numCells / size;
    const w = (imageSettings.width ?? Math.floor(size * DEFAULT_IMG_SCALE)) * scale;
    const h = (imageSettings.height ?? Math.floor(size * DEFAULT_IMG_SCALE)) * scale;
    const x = imageSettings.x == null ? moduleCount / 2 - w / 2 : imageSettings.x * scale;
    const y = imageSettings.y == null ? moduleCount / 2 - h / 2 : imageSettings.y * scale;
    image = { x, y, w, h, opacity: imageSettings.opacity ?? 1 };

    if (imageSettings.excavate) {
      hasExcavation = true;
      excavateX = Math.floor(x);
      excavateY = Math.floor(y);
      excavateW = Math.ceil(w + x - excavateX);
      excavateH = Math.ceil(h + y - excavateY);
    }
  }

  const modules: QrModule[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.modules.get(row, col)) continue;
      if (isFinderRegion(row, col, moduleCount)) continue;
      if (
        hasExcavation &&
        row >= excavateY &&
        row < excavateY + excavateH &&
        col >= excavateX &&
        col < excavateX + excavateW
      ) {
        continue;
      }
      modules.push({ row, col });
    }
  }

  const finderOrigins: QrFinderOrigin[] = [
    { row: 0, col: 0 },
    { row: 0, col: moduleCount - FINDER_SIZE },
    { row: moduleCount - FINDER_SIZE, col: 0 },
  ];

  return { numCells, margin, modules, finderOrigins, image };
}

export const DOT_INSET = 0.06;
export const DOT_CIRCLE_RADIUS = 0.42;
export const DOT_ROUNDED_RADIUS_RATIO = 0.35;

export function moduleShapeRect(style: DotStyle) {
  const size = 1 - DOT_INSET * 2;
  const radius = style === "ROUNDED" ? size * DOT_ROUNDED_RADIUS_RATIO : 0;
  return { inset: DOT_INSET, size, radius };
}

// A finder pattern is a 7x7 block: a 1-module-thick ring (the "frame") around
// an empty 1-module gap, with a solid 3x3 block (the "marker") centered inside.
// Ring = outer 7x7 minus an inset 5x5 hole; marker = the innermost 3x3.
export const FINDER_RING_OUTER = 7;
export const FINDER_RING_HOLE_INSET = 1;
export const FINDER_RING_HOLE_SIZE = 5;
export const FINDER_MARKER_INSET = 2;
export const FINDER_MARKER_SIZE = 3;

export const FINDER_ROUNDED_OUTER_RADIUS = 1.5;
export const FINDER_ROUNDED_INNER_RADIUS = 1.1;
export const FINDER_MARKER_ROUNDED_INSET = 0.15;
export const FINDER_MARKER_ROUNDED_RADIUS_RATIO = 0.3;

export const FINDER_RING_CIRCLE_OUTER_RADIUS = FINDER_RING_OUTER / 2;
export const FINDER_RING_CIRCLE_INNER_RADIUS = FINDER_RING_HOLE_SIZE / 2;
export const FINDER_MARKER_CIRCLE_RADIUS = 1.4;
