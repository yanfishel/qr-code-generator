"use client";

import { cn } from "@/lib/utils";

type ViewfinderFrameProps = {
  active: boolean;
  children: React.ReactNode;
};

const cornerClasses =
  "absolute size-6 border-primary transition-[border-color] duration-200 motion-reduce:transition-none";

export function ViewfinderFrame({ active, children }: ViewfinderFrameProps) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-3 transition-transform duration-300 ease-out motion-reduce:transition-none",
          active ? "scale-100" : "scale-105",
        )}
      >
        <span
          className={cn(
            cornerClasses,
            "top-0 left-0 rounded-tl-md border-t-2 border-l-2",
            !active && "border-border",
          )}
        />
        <span
          className={cn(
            cornerClasses,
            "top-0 right-0 rounded-tr-md border-t-2 border-r-2",
            !active && "border-border",
          )}
        />
        <span
          className={cn(
            cornerClasses,
            "bottom-0 left-0 rounded-bl-md border-b-2 border-l-2",
            !active && "border-border",
          )}
        />
        <span
          className={cn(
            cornerClasses,
            "bottom-0 right-0 rounded-br-md border-b-2 border-r-2",
            !active && "border-border",
          )}
        />
      </div>
      {children}
    </div>
  );
}
