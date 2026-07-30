"use client";

import { Input } from "@/components/ui/input";

type ColorPickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

function baseColor(value: string) {
  return /^#[0-9a-fA-F]{6}/.test(value) ? value.slice(0, 7) : "#FFFFFF";
}

function alphaPercent(value: string) {
  const match = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})$/.exec(value);
  if (!match) return 100;
  return Math.round((parseInt(match[1], 16) / 255) * 100);
}

function withAlpha(base: string, percent: number) {
  if (percent >= 100) return base;
  const byte = Math.round((percent / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${base}${byte}`;
}

export function ColorPickerField({ value, onChange, id }: ColorPickerFieldProps) {
  const base = baseColor(value);
  const alpha = alphaPercent(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={base}
          onChange={(e) => onChange(withAlpha(e.target.value, alpha))}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={alpha}
          onChange={(e) => onChange(withAlpha(base, Number(e.target.value)))}
          aria-label="Opacity"
          className="h-1.5 flex-1 cursor-pointer accent-primary"
        />
        <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground">
          {alpha}%
        </span>
      </div>
    </div>
  );
}
