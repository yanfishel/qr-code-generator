"use client";

import { cn } from "@/lib/utils";
import { errorCorrectionLevels } from "@/lib/qr-schema";

const LEVELS: { level: (typeof errorCorrectionLevels)[number]; label: string; pct: number }[] = [
  { level: "L", label: "Low", pct: 7 },
  { level: "M", label: "Medium", pct: 15 },
  { level: "Q", label: "Quartile", pct: 25 },
  { level: "H", label: "High", pct: 30 },
];

type ErrorCorrectionSelectorProps = {
  value: (typeof errorCorrectionLevels)[number];
  onChange: (value: (typeof errorCorrectionLevels)[number]) => void;
};

export function ErrorCorrectionSelector({ value, onChange }: ErrorCorrectionSelectorProps) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-4 gap-1.5">
        {LEVELS.map(({ level, label, pct }) => {
          const active = value === level;
          return (
            <button
              key={level}
              type="button"
              title={label}
              onClick={() => onChange(level)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border py-2 transition-colors",
                active
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className="block w-1.5 rounded-full bg-current"
                style={{ height: Math.max(4, 16 * (pct / 30)) }}
              />
              <span className="font-mono text-xs font-semibold">{level}</span>
              <span className="font-mono text-[0.6rem] opacity-70">{pct}%</span>
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[0.65rem] text-muted-foreground">
        Higher correction recovers from more damage, at the cost of a denser code.
      </p>
    </div>
  );
}
