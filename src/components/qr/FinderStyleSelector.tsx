"use client";

import { cn } from "@/lib/utils";
import { finderStyles, finderStyleLabels, type FinderStyle } from "@/lib/qr-schema";

const SHAPE_CLASSNAME: Record<FinderStyle, string> = {
  SQUARE: "rounded-none",
  ROUNDED: "rounded-[3px]",
  CIRCLE: "rounded-full",
};

type FinderStyleSelectorProps = {
  value: FinderStyle;
  onChange: (value: FinderStyle) => void;
  /** Hollow ring glyph for the frame selector vs. a solid glyph for the marker selector. */
  filled?: boolean;
};

export function FinderStyleSelector({ value, onChange, filled = true }: FinderStyleSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {finderStyles.map((style) => {
        const active = value === style;
        return (
          <button
            key={style}
            type="button"
            title={finderStyleLabels[style]}
            onClick={() => onChange(style)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-md border py-2 transition-colors",
              active
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "size-3",
                filled ? "bg-current" : "border-2 border-current bg-transparent",
                SHAPE_CLASSNAME[style],
              )}
              aria-hidden="true"
            />
            <span className="font-mono text-[0.6rem] tracking-wide uppercase">{finderStyleLabels[style]}</span>
          </button>
        );
      })}
    </div>
  );
}
