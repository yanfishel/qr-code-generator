"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import {
  buildQrLayout,
  moduleShapeRect,
  FINDER_RING_OUTER,
  FINDER_RING_HOLE_INSET,
  FINDER_RING_HOLE_SIZE,
  FINDER_MARKER_INSET,
  FINDER_MARKER_SIZE,
  FINDER_ROUNDED_OUTER_RADIUS,
  FINDER_ROUNDED_INNER_RADIUS,
  FINDER_MARKER_ROUNDED_INSET,
  FINDER_MARKER_ROUNDED_RADIUS_RATIO,
  FINDER_RING_CIRCLE_OUTER_RADIUS,
  FINDER_RING_CIRCLE_INNER_RADIUS,
  FINDER_MARKER_CIRCLE_RADIUS,
  type QrImageSettings,
  type QrModule,
  type QrFinderOrigin,
} from "@/lib/qr-render";
import type { DotStyle, FinderStyle, errorCorrectionLevels } from "@/lib/qr-schema";

type QrCanvasProps = {
  value: string;
  size: number;
  fgColor: string;
  bgColor: string;
  level: (typeof errorCorrectionLevels)[number];
  marginSize: number;
  dotStyle: DotStyle;
  finderFrameStyle: FinderStyle;
  finderMarkerStyle: FinderStyle;
  imageSettings?: QrImageSettings;
  style?: React.CSSProperties;
  className?: string;
};

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawModule(ctx: CanvasRenderingContext2D, style: DotStyle, mod: QrModule, margin: number) {
  const x = mod.col + margin;
  const y = mod.row + margin;

  switch (style) {
    case "DOTS": {
      ctx.beginPath();
      ctx.arc(x + 0.5, y + 0.5, 0.42, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "ROUNDED": {
      const { inset, size, radius } = moduleShapeRect(style);
      ctx.beginPath();
      roundRectPath(ctx, x + inset, y + inset, size, size, radius);
      ctx.fill();
      break;
    }
    case "CLASSY": {
      const cx = x + 0.5;
      const cy = y + 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 0.5);
      ctx.lineTo(cx + 0.5, cy);
      ctx.lineTo(cx, cy + 0.5);
      ctx.lineTo(cx - 0.5, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      ctx.fillRect(x, y, 1, 1);
  }
}

function drawFinderFrame(ctx: CanvasRenderingContext2D, x: number, y: number, style: FinderStyle) {
  ctx.beginPath();
  switch (style) {
    case "CIRCLE": {
      const cx = x + FINDER_RING_OUTER / 2;
      const cy = y + FINDER_RING_OUTER / 2;
      ctx.moveTo(cx + FINDER_RING_CIRCLE_OUTER_RADIUS, cy);
      ctx.arc(cx, cy, FINDER_RING_CIRCLE_OUTER_RADIUS, 0, Math.PI * 2);
      ctx.moveTo(cx + FINDER_RING_CIRCLE_INNER_RADIUS, cy);
      ctx.arc(cx, cy, FINDER_RING_CIRCLE_INNER_RADIUS, 0, Math.PI * 2);
      break;
    }
    case "ROUNDED":
      roundRectPath(ctx, x, y, FINDER_RING_OUTER, FINDER_RING_OUTER, FINDER_ROUNDED_OUTER_RADIUS);
      roundRectPath(
        ctx,
        x + FINDER_RING_HOLE_INSET,
        y + FINDER_RING_HOLE_INSET,
        FINDER_RING_HOLE_SIZE,
        FINDER_RING_HOLE_SIZE,
        FINDER_ROUNDED_INNER_RADIUS,
      );
      break;
    default:
      ctx.rect(x, y, FINDER_RING_OUTER, FINDER_RING_OUTER);
      ctx.rect(x + FINDER_RING_HOLE_INSET, y + FINDER_RING_HOLE_INSET, FINDER_RING_HOLE_SIZE, FINDER_RING_HOLE_SIZE);
  }
  ctx.fill("evenodd");
}

function drawFinderMarker(ctx: CanvasRenderingContext2D, x: number, y: number, style: FinderStyle) {
  ctx.beginPath();
  switch (style) {
    case "CIRCLE": {
      const cx = x + FINDER_RING_OUTER / 2;
      const cy = y + FINDER_RING_OUTER / 2;
      ctx.arc(cx, cy, FINDER_MARKER_CIRCLE_RADIUS, 0, Math.PI * 2);
      break;
    }
    case "ROUNDED": {
      const size = FINDER_MARKER_SIZE - FINDER_MARKER_ROUNDED_INSET * 2;
      const radius = size * FINDER_MARKER_ROUNDED_RADIUS_RATIO;
      roundRectPath(
        ctx,
        x + FINDER_MARKER_INSET + FINDER_MARKER_ROUNDED_INSET,
        y + FINDER_MARKER_INSET + FINDER_MARKER_ROUNDED_INSET,
        size,
        size,
        radius,
      );
      break;
    }
    default:
      ctx.rect(x + FINDER_MARKER_INSET, y + FINDER_MARKER_INSET, FINDER_MARKER_SIZE, FINDER_MARKER_SIZE);
  }
  ctx.fill();
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  origin: QrFinderOrigin,
  margin: number,
  frameStyle: FinderStyle,
  markerStyle: FinderStyle,
) {
  const x = origin.col + margin;
  const y = origin.row + margin;
  drawFinderFrame(ctx, x, y, frameStyle);
  drawFinderMarker(ctx, x, y, markerStyle);
}

export const QrCanvas = forwardRef<HTMLCanvasElement, QrCanvasProps>(function QrCanvas(
  {
    value,
    size,
    fgColor,
    bgColor,
    level,
    marginSize,
    dotStyle,
    finderFrameStyle,
    finderMarkerStyle,
    imageSettings,
    style,
    className,
  },
  forwardedRef,
) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const setCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasElRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useEffect(() => {
    if (!imageSettings?.src) {
      logoImgRef.current = null;
      setLogoLoaded(false);
      return;
    }
    setLogoLoaded(false);
    const img = new Image();
    img.onload = () => setLogoLoaded(true);
    img.src = imageSettings.src;
    logoImgRef.current = img;
  }, [imageSettings?.src]);

  useEffect(() => {
    const canvas = canvasElRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const layout = buildQrLayout({ value, level, size, margin: marginSize, imageSettings });
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = (size / layout.numCells) * pixelRatio;
    ctx.scale(scale, scale);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, layout.numCells, layout.numCells);

    ctx.fillStyle = fgColor;
    for (const mod of layout.modules) {
      drawModule(ctx, dotStyle, mod, layout.margin);
    }
    for (const origin of layout.finderOrigins) {
      drawFinderPattern(ctx, origin, layout.margin, finderFrameStyle, finderMarkerStyle);
    }

    if (layout.image && logoImgRef.current && logoLoaded) {
      ctx.globalAlpha = layout.image.opacity;
      ctx.drawImage(
        logoImgRef.current,
        layout.image.x + layout.margin,
        layout.image.y + layout.margin,
        layout.image.w,
        layout.image.h,
      );
      ctx.globalAlpha = 1;
    }
  }, [
    value,
    size,
    fgColor,
    bgColor,
    level,
    marginSize,
    dotStyle,
    finderFrameStyle,
    finderMarkerStyle,
    imageSettings,
    logoLoaded,
  ]);

  return <canvas ref={setCanvasRef} style={style} className={className} />;
});
