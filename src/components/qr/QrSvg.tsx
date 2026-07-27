"use client";

import { forwardRef } from "react";

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

type QrSvgProps = {
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
  className?: string;
};

function squarePathD(modules: QrModule[], margin: number): string {
  let d = "";
  for (const mod of modules) {
    d += `M${mod.col + margin},${mod.row + margin} h1v1h-1z`;
  }
  return d;
}

function squareSubpath(x: number, y: number, s: number): string {
  return `M${x},${y} h${s} v${s} h${-s} z`;
}

function circleSubpath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} z`;
}

function roundedRectSubpath(x: number, y: number, s: number, r: number): string {
  const x2 = x + s;
  const y2 = y + s;
  return (
    `M${x + r},${y} H${x2 - r} A${r},${r} 0 0 1 ${x2},${y + r} V${y2 - r} ` +
    `A${r},${r} 0 0 1 ${x2 - r},${y2} H${x + r} A${r},${r} 0 0 1 ${x},${y2 - r} ` +
    `V${y + r} A${r},${r} 0 0 1 ${x + r},${y} z`
  );
}

function renderStyledModule(mod: QrModule, style: DotStyle, margin: number, fill: string) {
  const x = mod.col + margin;
  const y = mod.row + margin;
  const key = `${mod.row}-${mod.col}`;

  if (style === "DOTS") {
    return <circle key={key} cx={x + 0.5} cy={y + 0.5} r={0.42} fill={fill} shapeRendering="geometricPrecision" />;
  }
  if (style === "ROUNDED") {
    const { inset, size, radius } = moduleShapeRect(style);
    return (
      <rect
        key={key}
        x={x + inset}
        y={y + inset}
        width={size}
        height={size}
        rx={radius}
        fill={fill}
        shapeRendering="geometricPrecision"
      />
    );
  }
  // CLASSY
  const cx = x + 0.5;
  const cy = y + 0.5;
  return (
    <polygon
      key={key}
      points={`${cx},${cy - 0.5} ${cx + 0.5},${cy} ${cx},${cy + 0.5} ${cx - 0.5},${cy}`}
      fill={fill}
      shapeRendering="geometricPrecision"
    />
  );
}

function renderFinderFrame(origin: QrFinderOrigin, margin: number, style: FinderStyle, fill: string) {
  const x = origin.col + margin;
  const y = origin.row + margin;
  let outer: string;
  let inner: string;

  if (style === "CIRCLE") {
    const cx = x + FINDER_RING_OUTER / 2;
    const cy = y + FINDER_RING_OUTER / 2;
    outer = circleSubpath(cx, cy, FINDER_RING_CIRCLE_OUTER_RADIUS);
    inner = circleSubpath(cx, cy, FINDER_RING_CIRCLE_INNER_RADIUS);
  } else if (style === "ROUNDED") {
    outer = roundedRectSubpath(x, y, FINDER_RING_OUTER, FINDER_ROUNDED_OUTER_RADIUS);
    inner = roundedRectSubpath(
      x + FINDER_RING_HOLE_INSET,
      y + FINDER_RING_HOLE_INSET,
      FINDER_RING_HOLE_SIZE,
      FINDER_ROUNDED_INNER_RADIUS,
    );
  } else {
    outer = squareSubpath(x, y, FINDER_RING_OUTER);
    inner = squareSubpath(x + FINDER_RING_HOLE_INSET, y + FINDER_RING_HOLE_INSET, FINDER_RING_HOLE_SIZE);
  }

  return (
    <path
      key={`frame-${origin.row}-${origin.col}`}
      d={outer + inner}
      fillRule="evenodd"
      fill={fill}
      shapeRendering={style === "SQUARE" ? "crispEdges" : "geometricPrecision"}
    />
  );
}

function renderFinderMarker(origin: QrFinderOrigin, margin: number, style: FinderStyle, fill: string) {
  const x = origin.col + margin;
  const y = origin.row + margin;
  const key = `marker-${origin.row}-${origin.col}`;

  if (style === "CIRCLE") {
    const cx = x + FINDER_RING_OUTER / 2;
    const cy = y + FINDER_RING_OUTER / 2;
    return <circle key={key} cx={cx} cy={cy} r={FINDER_MARKER_CIRCLE_RADIUS} fill={fill} />;
  }
  if (style === "ROUNDED") {
    const size = FINDER_MARKER_SIZE - FINDER_MARKER_ROUNDED_INSET * 2;
    const radius = size * FINDER_MARKER_ROUNDED_RADIUS_RATIO;
    return (
      <rect
        key={key}
        x={x + FINDER_MARKER_INSET + FINDER_MARKER_ROUNDED_INSET}
        y={y + FINDER_MARKER_INSET + FINDER_MARKER_ROUNDED_INSET}
        width={size}
        height={size}
        rx={radius}
        fill={fill}
      />
    );
  }
  return (
    <rect
      key={key}
      x={x + FINDER_MARKER_INSET}
      y={y + FINDER_MARKER_INSET}
      width={FINDER_MARKER_SIZE}
      height={FINDER_MARKER_SIZE}
      fill={fill}
      shapeRendering="crispEdges"
    />
  );
}

export const QrSvg = forwardRef<SVGSVGElement, QrSvgProps>(function QrSvg(
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
    className,
  },
  forwardedRef,
) {
  if (!value) return null;

  const layout = buildQrLayout({ value, level, size, margin: marginSize, imageSettings });
  const squareModules = dotStyle === "SQUARE" ? layout.modules : [];
  const styledModules = dotStyle === "SQUARE" ? [] : layout.modules;

  return (
    <svg
      ref={forwardedRef}
      height={size}
      width={size}
      viewBox={`0 0 ${layout.numCells} ${layout.numCells}`}
      role="img"
      className={className}
    >
      <path fill={bgColor} d={`M0,0 h${layout.numCells}v${layout.numCells}H0z`} shapeRendering="crispEdges" />
      {squareModules.length ? (
        <path fill={fgColor} d={squarePathD(squareModules, layout.margin)} shapeRendering="crispEdges" />
      ) : null}
      {styledModules.map((mod) => renderStyledModule(mod, dotStyle, layout.margin, fgColor))}
      {layout.finderOrigins.map((origin) => renderFinderFrame(origin, layout.margin, finderFrameStyle, fgColor))}
      {layout.finderOrigins.map((origin) => renderFinderMarker(origin, layout.margin, finderMarkerStyle, fgColor))}
      {layout.image && imageSettings ? (
        <image
          href={imageSettings.src}
          height={layout.image.h}
          width={layout.image.w}
          x={layout.image.x + layout.margin}
          y={layout.image.y + layout.margin}
          preserveAspectRatio="none"
          opacity={layout.image.opacity}
        />
      ) : null}
    </svg>
  );
});
