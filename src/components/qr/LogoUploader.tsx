"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_LOGO_DIMENSION = 256;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type LogoUploaderProps = {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
};

function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode the image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function LogoUploader({ value, onChange }: LogoUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image is too large (max 5MB)");
      return;
    }

    try {
      const dataUrl = await downscaleImage(file);
      onChange(dataUrl);
    } catch {
      setError("Could not process this image");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} />
        {value ? (
          <div className="relative shrink-0">
            <img src={value} alt="Logo preview" className="size-9 rounded object-contain" />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="absolute -top-2 -right-2 rounded-full"
              onClick={() => onChange(undefined)}
              aria-label="Remove logo"
            >
              <X />
            </Button>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
