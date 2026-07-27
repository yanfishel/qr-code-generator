"use client";

import { Link, FileText, Mail, Wifi, User, MessageSquare, Phone, MapPin, Bitcoin } from "lucide-react";

import { cn } from "@/lib/utils";
import { qrTypeLabels, type QrType } from "@/lib/qr-schema";

const TYPES: { id: QrType; icon: React.ElementType }[] = [
  { id: "URL", icon: Link },
  { id: "TEXT", icon: FileText },
  { id: "EMAIL", icon: Mail },
  { id: "WIFI", icon: Wifi },
  { id: "VCARD", icon: User },
  { id: "SMS", icon: MessageSquare },
  { id: "PHONE", icon: Phone },
  { id: "LOCATION", icon: MapPin },
  { id: "BITCOIN", icon: Bitcoin },
];

type QrTypeSelectorProps = {
  value: QrType;
  onChange: (type: QrType) => void;
};

export function QrTypeSelector({ value, onChange }: QrTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {TYPES.map(({ id, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-md border px-2 py-1.5 transition-colors",
              active
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} />
            <span className="font-mono text-[0.6rem] tracking-wide uppercase">
              {qrTypeLabels[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
