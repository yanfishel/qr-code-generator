"use client";

import { Input } from "@/components/ui/input";

type ColorPickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

export function ColorPickerField({ value, onChange, id }: ColorPickerFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={/^#([0-9a-fA-F]{6})$/.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="font-mono"
      />
    </div>
  );
}
