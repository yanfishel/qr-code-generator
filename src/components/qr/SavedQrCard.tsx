"use client";

import { useRef } from "react";
import Link from "next/link";
import { Trash2, Download, Pencil } from "lucide-react";
import type { QrCode } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QrCanvas } from "@/components/qr/QrCanvas";
import { QrSvg } from "@/components/qr/QrSvg";
import { QrTypeBadge } from "@/components/qr/QrTypeBadge";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQrDownload } from "@/hooks/use-qr-download";

type SavedQrCardProps = {
  qrCode: QrCode;
  onDelete: (id: string) => void;
};

const PREVIEW_SIZE = 200;

export function SavedQrCard({ qrCode, onDelete }: SavedQrCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const download = useQrDownload();

  const imageSettings = qrCode.logoDataUrl
    ? {
        src: qrCode.logoDataUrl,
        height: PREVIEW_SIZE * (qrCode.logoSize / 100),
        width: PREVIEW_SIZE * (qrCode.logoSize / 100),
        excavate: true,
      }
    : undefined;

  return (
    <Card className="gap-0 overflow-hidden py-0 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
      <CardContent className="relative flex justify-center bg-soft-gradient p-3">
        <QrTypeBadge type={qrCode.type} className="absolute top-1 left-1 z-10 shadow-sm" />
        <QrCanvas
          ref={canvasRef}
          value={qrCode.data}
          size={PREVIEW_SIZE}
          fgColor={qrCode.fgColor}
          bgColor={qrCode.bgColor}
          level={qrCode.level}
          marginSize={qrCode.margin}
          dotStyle={qrCode.dotStyle}
          finderFrameStyle={qrCode.finderFrameStyle}
          finderMarkerStyle={qrCode.finderMarkerStyle}
          imageSettings={imageSettings}
          style={{width:'100%', height:'100%'}}
        />
        <QrSvg
          ref={svgRef}
          value={qrCode.data}
          size={PREVIEW_SIZE}
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
      <CardFooter className="flex-col items-stretch gap-3">
        <p className="truncate text-sm font-medium">{qrCode.name || qrCode.data}</p>
        <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon-sm" className="cursor-pointer" aria-label="Download">
                    <Download />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onSelect={() => download(canvasRef.current, qrCode.name || qrCode.id)}
              >
                Download PNG
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => download(svgRef.current, qrCode.name || qrCode.id)}
              >
                Download SVG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="cursor-pointer text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
                aria-label="Edit"
                asChild
              >
                <Link href={`/saved/${qrCode.id}/edit`}>
                  <Pencil />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="cursor-pointer text-destructive hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
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
