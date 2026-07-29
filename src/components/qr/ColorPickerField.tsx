"use client";

import { SquareDashed } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ColorPickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  allowTransparent?: boolean;
};

const TRANSPARENT_SUFFIX = "00";

function opaqueBase(value: string) {
  return /^#[0-9a-fA-F]{6}/.test(value) ? value.slice(0, 7) : "#FFFFFF";
}

export function ColorPickerField({ value, onChange, id, allowTransparent }: ColorPickerFieldProps) {
  const isTransparent = !!allowTransparent && /^#[0-9a-fA-F]{6}00$/.test(value);

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={/^#([0-9a-fA-F]{6})$/.test(value) ? value : opaqueBase(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={isTransparent}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-40"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        disabled={isTransparent}
        className="font-mono disabled:opacity-60"
      />
      {allowTransparent ? (
        <button
          type="button"
          title={isTransparent ? "Use a solid background color" : "Make the background transparent"}
          aria-pressed={isTransparent}
          onClick={() =>
            onChange(isTransparent ? opaqueBase(value) : `${opaqueBase(value)}${TRANSPARENT_SUFFIX}`)
          }
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
            isTransparent
              ? "cursor-default border-primary bg-accent text-accent-foreground"
              : "cursor-pointer border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          <SquareDashed className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
