"use client";

import { Ban } from "lucide-react";

import { cn } from "@/lib/utils";
import { logoPresets } from "@/lib/logo-presets";

type PresetLogoPickerProps = {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
};

export function PresetLogoPicker({ value, onChange }: PresetLogoPickerProps) {
  return (
    <div className="-mx-1.5 flex gap-2 overflow-x-auto p-1.5">
      <button
        type="button"
        title="No logo"
        aria-pressed={!value}
        onClick={() => onChange(undefined)}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors",
          !value
            ? "cursor-default border-primary ring-2 ring-primary/40"
            : "cursor-pointer border-border hover:border-primary/40 hover:text-foreground",
        )}
      >
        <Ban className="size-4" strokeWidth={1.5} />
      </button>
      {logoPresets.map(({ id, label, icon: Icon, dataUrl }) => {
        const active = value === dataUrl;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-pressed={active}
            onClick={() => onChange(dataUrl)}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-[opacity,box-shadow]",
              active
                ? "cursor-default ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "cursor-pointer opacity-80 hover:opacity-100",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
