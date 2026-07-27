"use client";

import { useCallback } from "react";

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

function withExtension(filename: string, ext: string) {
  return filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
}

export function useQrDownload() {
  return useCallback((element: HTMLCanvasElement | SVGSVGElement | null, filename: string) => {
    if (!element) return;

    if (element instanceof HTMLCanvasElement) {
      triggerDownload(element.toDataURL("image/png"), withExtension(filename, "png"));
      return;
    }

    const svgMarkup = new XMLSerializer().serializeToString(element);
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, withExtension(filename, "svg"));
    URL.revokeObjectURL(url);
  }, []);
}
