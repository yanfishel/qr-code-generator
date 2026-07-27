"use client";

import { useRef } from "react";
import { Trash2, Download } from "lucide-react";
import type { QrCode } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { QrCanvas } from "@/components/qr/QrCanvas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQrDownload } from "@/hooks/use-qr-download";
import { qrTypeLabels } from "@/lib/qr-schema";

type SavedQrCardProps = {
  qrCode: QrCode;
  onDelete: (id: string) => void;
};

export function SavedQrCard({ qrCode, onDelete }: SavedQrCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const download = useQrDownload();

  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardContent className="flex justify-center p-4">
        <QrCanvas
          ref={canvasRef}
          value={qrCode.data}
          size={200}
          fgColor={qrCode.fgColor}
          bgColor={qrCode.bgColor}
          level={qrCode.level}
          marginSize={qrCode.margin}
          dotStyle={qrCode.dotStyle}
          finderFrameStyle={qrCode.finderFrameStyle}
          finderMarkerStyle={qrCode.finderMarkerStyle}
          imageSettings={
            qrCode.logoDataUrl
              ? {
                  src: qrCode.logoDataUrl,
                  height: 200 * (qrCode.logoSize / 100),
                  width: 200 * (qrCode.logoSize / 100),
                  excavate: true,
                }
              : undefined
          }
        />
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[0.6rem] tracking-wide uppercase">
            {qrTypeLabels[qrCode.type]}
          </Badge>
          <p className="truncate text-sm font-medium">{qrCode.name || qrCode.data}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => download(canvasRef.current, qrCode.name || qrCode.id)}
          >
            <Download /> Download
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Delete">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this QR code?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(qrCode.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
