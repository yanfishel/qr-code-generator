"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_OPTIONS: { value: "light" | "dark" | "system"; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

type Point = { x: number; y: number };

function triggerCenter(el: HTMLElement | null): Point {
  if (!el) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pointerOriginRef = useRef<Point | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const TriggerIcon = mounted
    ? (THEME_OPTIONS.find((option) => option.value === theme)?.icon ?? Monitor)
    : Monitor;

  function handleThemeChange(value: string) {
    const origin = pointerOriginRef.current ?? triggerCenter(triggerRef.current);
    pointerOriginRef.current = null;

    if (!("startViewTransition" in document) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(value);
      return;
    }

    const root = document.documentElement;
    const radius = Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y),
    );
    root.style.setProperty("--theme-x", `${origin.x}px`);
    root.style.setProperty("--theme-y", `${origin.y}px`);
    root.style.setProperty("--theme-radius", `${radius}px`);

    document.startViewTransition(() => {
      flushSync(() => setTheme(value));
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Change theme"
          className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border border-border/70 bg-background text-foreground hover:bg-muted"
        >
          <TriggerIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              onPointerDown={(e) => {
                pointerOriginRef.current = { x: e.clientX, y: e.clientY };
              }}
            >
              <Icon className="size-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
