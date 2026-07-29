"use client";

import {
  Link,
  FileText,
  Mail,
  Wifi,
  User,
  MessageSquare,
  Phone,
  MapPin,
  Bitcoin,
  MessageCircle,
  CalendarDays,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { qrTypeLabels, type QrType } from "@/lib/qr-schema";

const TYPES: { id: QrType; icon: React.ElementType }[] = [
  { id: "URL", icon: Link },
  { id: "TEXT", icon: FileText },
  { id: "VCARD", icon: User },
  { id: "EMAIL", icon: Mail },
  { id: "LOCATION", icon: MapPin },
  { id: "PHONE", icon: Phone },
  { id: "SMS", icon: MessageSquare },
  { id: "WHATSAPP", icon: MessageCircle },
  { id: "EVENT", icon: CalendarDays },
  { id: "WIFI", icon: Wifi },
  { id: "PAYPAL", icon: Wallet },
  { id: "BITCOIN", icon: Bitcoin },
];

export const qrTypeIcons: Record<QrType, React.ElementType> = TYPES.reduce(
  (acc, { id, icon }) => ({ ...acc, [id]: icon }),
  {} as Record<QrType, React.ElementType>,
);

type QrTypeSelectorProps = {
  value: QrType;
  onChange: (type: QrType) => void;
};

export function QrTypeSelector({ value, onChange }: QrTypeSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
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
                ? "cursor-default border-primary bg-accent text-accent-foreground"
                : "cursor-pointer border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground",
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
