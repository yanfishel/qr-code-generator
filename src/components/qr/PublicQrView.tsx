"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import type { PublicQrCode } from "@/actions/qr-actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ViewfinderFrame } from "@/components/qr/ViewfinderFrame";
import { QrCanvas } from "@/components/qr/QrCanvas";
import { QrSvg } from "@/components/qr/QrSvg";
import { useQrDownload } from "@/hooks/use-qr-download";

type PublicQrViewProps = {
  qrCode: PublicQrCode;
};

export function PublicQrView({ qrCode }: PublicQrViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const download = useQrDownload();

  const imageSettings = qrCode.logoDataUrl
    ? {
        src: qrCode.logoDataUrl,
        height: Math.round(qrCode.size * (qrCode.logoSize / 100)),
        width: Math.round(qrCode.size * (qrCode.logoSize / 100)),
        excavate: true,
      }
    : undefined;

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6">
      <ViewfinderFrame active className="w-full">
        <Card className="aspect-square w-full gap-0 bg-soft-gradient py-0 shadow-lg shadow-primary/10 ring-1 ring-primary/15">
          <CardContent className="flex h-full items-center justify-center p-5">
            <QrCanvas
              ref={canvasRef}
              value={qrCode.data}
              size={qrCode.size}
              fgColor={qrCode.fgColor}
              bgColor={qrCode.bgColor}
              level={qrCode.level}
              marginSize={qrCode.margin}
              dotStyle={qrCode.dotStyle}
              finderFrameStyle={qrCode.finderFrameStyle}
              finderMarkerStyle={qrCode.finderMarkerStyle}
              imageSettings={imageSettings}
              style={{ width: `min(100%, ${qrCode.size}px)`, height: "auto" }}
            />
            <QrSvg
              ref={svgRef}
              value={qrCode.data}
              size={qrCode.size}
              fgColor={qrCode.fgColor}
              bgColor={qrCode.bgColor}
              level={qrCode.level}
              marginSize={qrCode.margin}
              dotStyle={qrCode.dotStyle}
              finderFrameStyle={qrCode.finderFrameStyle}
              finderMarkerStyle={qrCode.finderMarkerStyle}
              imageSettings={imageSettings}
              className="hidden"
            />
          </CardContent>
        </Card>
      </ViewfinderFrame>

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => download(canvasRef.current, qrCode.name || qrCode.id)}
        >
          <Download /> PNG
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => download(svgRef.current, qrCode.name || qrCode.id)}
        >
          <Download /> SVG
        </Button>
      </div>
    </div>
  );
}
