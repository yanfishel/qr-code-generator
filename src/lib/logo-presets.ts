import { Link, Phone, Mail, Wifi, MapPin, MessageCircle, CalendarDays, Wallet } from "lucide-react";
import type { ComponentType } from "react";

const PRIMARY = "#0E9E92";
const ON_PRIMARY = "#F7FDFC";

function presetLogo(paths: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256">` +
    `<circle cx="12" cy="12" r="12" fill="${PRIMARY}"/>` +
    `<g fill="none" stroke="${ON_PRIMARY}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 12) scale(0.62) translate(-12 -12)">${paths}</g>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export type LogoPreset = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  dataUrl: string;
};

export const logoPresets: LogoPreset[] = [
  {
    id: "link",
    label: "URL",
    icon: Link,
    dataUrl: presetLogo(
      '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
        '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    ),
  },
  {
    id: "phone",
    label: "Phone",
    icon: Phone,
    dataUrl: presetLogo(
      '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
    ),
  },
  {
    id: "mail",
    label: "Email",
    icon: Mail,
    dataUrl: presetLogo(
      '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
    ),
  },
  {
    id: "wifi",
    label: "Wi-Fi",
    icon: Wifi,
    dataUrl: presetLogo(
      '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/>' +
        '<path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
    ),
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    dataUrl: presetLogo(
      '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>' +
        '<circle cx="12" cy="10" r="3"/>',
    ),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    dataUrl: presetLogo(
      '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
    ),
  },
  {
    id: "event",
    label: "Event",
    icon: CalendarDays,
    dataUrl: presetLogo(
      '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>' +
        '<path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/>' +
        '<path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
    ),
  },
  {
    id: "payment",
    label: "Payment",
    icon: Wallet,
    dataUrl: presetLogo(
      '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>' +
        '<path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    ),
  },
];
