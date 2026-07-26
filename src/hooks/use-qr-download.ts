"use client";

import { useCallback } from "react";

export function useQrDownload() {
  return useCallback((canvas: HTMLCanvasElement | null, filename: string) => {
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    link.click();
  }, []);
}
