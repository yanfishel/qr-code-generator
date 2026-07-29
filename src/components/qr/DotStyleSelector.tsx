"use client";

import { cn } from "@/lib/utils";
import { dotStyles, dotStyleLabels, type DotStyle } from "@/lib/qr-schema";

const SHAPE_CLASSNAME: Record<DotStyle, string> = {
  SQUARE: "rounded-none",
  ROUNDED: "rounded-[3px]",
  DOTS: "rounded-full",
  CLASSY: "rotate-45",
};

type DotStyleSelectorProps = {
  value: DotStyle;
  onChange: (value: DotStyle) => void;
};

export function DotStyleSelector({ value, onChange }: DotStyleSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {dotStyles.map((style) => {
        const active = value === style;
        return (
          <button
            key={style}
            type="button"
            title={dotStyleLabels[style]}
            onClick={() => onChange(style)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-md border py-2 transition-colors",
              active
                ? "cursor-default border-primary bg-accent text-accent-foreground"
                : "cursor-pointer border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <span className="flex gap-0.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className={cn("size-2 bg-current", SHAPE_CLASSNAME[style])} />
              ))}
            </span>
            <span className="font-mono text-[0.6rem] tracking-wide uppercase">
              {dotStyleLabels[style]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
