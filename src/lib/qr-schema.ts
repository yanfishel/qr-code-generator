import { z } from "zod";

export const errorCorrectionLevels = ["L", "M", "Q", "H"] as const;
const hexColor = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const dotStyles = ["SQUARE", "ROUNDED", "DOTS", "CLASSY"] as const;
export type DotStyle = (typeof dotStyles)[number];
export const dotStyleLabels: Record<DotStyle, string> = {
  SQUARE: "Square",
  ROUNDED: "Rounded",
  DOTS: "Dots",
  CLASSY: "Classy",
};

export const finderStyles = ["SQUARE", "ROUNDED", "CIRCLE"] as const;
export type FinderStyle = (typeof finderStyles)[number];
export const finderStyleLabels: Record<FinderStyle, string> = {
  SQUARE: "Square",
  ROUNDED: "Rounded",
  CIRCLE: "Circle",
};

export const qrTypes = [
  "URL",
  "TEXT",
  "EMAIL",
  "WIFI",
  "VCARD",
  "SMS",
  "PHONE",
  "LOCATION",
  "BITCOIN",
  "WHATSAPP",
  "EVENT",
  "PAYPAL",
] as const;
export type QrType = (typeof qrTypes)[number];

export const qrTypeLabels: Record<QrType, string> = {
  URL: "URL",
  TEXT: "Text",
  EMAIL: "Email",
  WIFI: "Wi-Fi",
  VCARD: "Contact",
  SMS: "SMS",
  PHONE: "Phone",
  LOCATION: "Location",
  BITCOIN: "Bitcoin",
  WHATSAPP: "WhatsApp",
  EVENT: "Event",
  PAYPAL: "PayPal",
};

// A fixed 30°-apart hue rotation — one stop per type, like marks on a dial —
// so badge colors read as a designed system rather than an arbitrary
// per-category color pick. Combined with color-mix() against the theme's
// background/foreground tokens (the same technique globals.css already uses
// for tints), this stays legible and on-brand in both light and dark mode
// without a hand-authored palette per type per theme.
export const qrTypeAccentHue: Record<QrType, number> = {
  LOCATION: 10,
  BITCOIN: 40,
  EVENT: 70,
  TEXT: 100,
  WHATSAPP: 130,
  PHONE: 160,
  WIFI: 190,
  URL: 220,
  PAYPAL: 250,
  VCARD: 280,
  EMAIL: 310,
  SMS: 340,
};

export type QrFieldValues = {
  url: string;
  text: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: string;
  wifiHidden: boolean;
  vcardFirstName: string;
  vcardLastName: string;
  vcardPhone: string;
  vcardEmail: string;
  vcardOrg: string;
  vcardTitle: string;
  vcardWebsite: string;
  smsPhone: string;
  smsMessage: string;
  phone: string;
  lat: string;
  lng: string;
  bitcoinAddress: string;
  bitcoinAmount: string;
  bitcoinLabel: string;
  whatsappPhone: string;
  whatsappMessage: string;
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  eventLocation: string;
  paypalUsername: string;
  paypalAmount: string;
};

export const defaultQrFieldValues: QrFieldValues = {
  url: "",
  text: "",
  emailTo: "",
  emailSubject: "",
  emailBody: "",
  wifiSsid: "",
  wifiPassword: "",
  wifiEncryption: "WPA",
  wifiHidden: false,
  vcardFirstName: "",
  vcardLastName: "",
  vcardPhone: "",
  vcardEmail: "",
  vcardOrg: "",
  vcardTitle: "",
  vcardWebsite: "",
  smsPhone: "",
  smsMessage: "",
  phone: "",
  lat: "",
  lng: "",
  bitcoinAddress: "",
  bitcoinAmount: "",
  bitcoinLabel: "",
  whatsappPhone: "",
  whatsappMessage: "",
  eventTitle: "",
  eventStart: "",
  eventEnd: "",
  eventLocation: "",
  paypalUsername: "",
  paypalAmount: "",
};

export function buildQrValue(type: QrType, fields: QrFieldValues): string {
  switch (type) {
    case "URL":
      return fields.url.trim();
    case "TEXT":
      return fields.text.trim();
    case "EMAIL": {
      if (!fields.emailTo.trim()) return "";
      const params: string[] = [];
      if (fields.emailSubject) params.push(`subject=${encodeURIComponent(fields.emailSubject)}`);
      if (fields.emailBody) params.push(`body=${encodeURIComponent(fields.emailBody)}`);
      return `mailto:${fields.emailTo}${params.length ? "?" + params.join("&") : ""}`;
    }
    case "WIFI":
      return fields.wifiSsid.trim()
        ? `WIFI:T:${fields.wifiEncryption};S:${fields.wifiSsid};P:${fields.wifiPassword};H:${
            fields.wifiHidden ? "true" : "false"
          };;`
        : "";
    case "VCARD": {
      const name = [fields.vcardLastName, fields.vcardFirstName].filter(Boolean).join(";");
      if (!name) return "";
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${name}`,
        `FN:${[fields.vcardFirstName, fields.vcardLastName].filter(Boolean).join(" ")}`,
        fields.vcardPhone && `TEL:${fields.vcardPhone}`,
        fields.vcardEmail && `EMAIL:${fields.vcardEmail}`,
        fields.vcardOrg && `ORG:${fields.vcardOrg}`,
        fields.vcardTitle && `TITLE:${fields.vcardTitle}`,
        fields.vcardWebsite && `URL:${fields.vcardWebsite}`,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
    }
    case "SMS":
      return fields.smsPhone.trim() ? `smsto:${fields.smsPhone}:${fields.smsMessage}` : "";
    case "PHONE":
      return fields.phone.trim() ? `tel:${fields.phone}` : "";
    case "LOCATION":
      return fields.lat.trim() && fields.lng.trim() ? `geo:${fields.lat},${fields.lng}` : "";
    case "BITCOIN": {
      if (!fields.bitcoinAddress.trim()) return "";
      const params: string[] = [];
      if (fields.bitcoinAmount) params.push(`amount=${fields.bitcoinAmount}`);
      if (fields.bitcoinLabel) params.push(`label=${encodeURIComponent(fields.bitcoinLabel)}`);
      return `bitcoin:${fields.bitcoinAddress}${params.length ? "?" + params.join("&") : ""}`;
    }
    case "WHATSAPP": {
      const digits = fields.whatsappPhone.replace(/\D/g, "");
      if (!digits) return "";
      const query = fields.whatsappMessage
        ? `?text=${encodeURIComponent(fields.whatsappMessage)}`
        : "";
      return `https://wa.me/${digits}${query}`;
    }
    case "EVENT": {
      if (!fields.eventTitle.trim() || !fields.eventStart.trim()) return "";
      const toIcsDate = (value: string) => value.replace(/[-:]/g, "") + "00";
      return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${fields.eventTitle}`,
        `DTSTART:${toIcsDate(fields.eventStart)}`,
        fields.eventEnd && `DTEND:${toIcsDate(fields.eventEnd)}`,
        fields.eventLocation && `LOCATION:${fields.eventLocation}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ]
        .filter(Boolean)
        .join("\n");
    }
    case "PAYPAL": {
      if (!fields.paypalUsername.trim()) return "";
      return `https://paypal.me/${fields.paypalUsername.trim()}${
        fields.paypalAmount ? "/" + fields.paypalAmount : ""
      }`;
    }
    default:
      return "";
  }
}

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseQuery(query: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of query.split("&")) {
    if (!pair) continue;
    const [key, value = ""] = pair.split("=");
    params[key] = decodeParam(value);
  }
  return params;
}

function fromIcsDate(value: string): string {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})\d{2}$/);
  if (!match) return "";
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// Best-effort inverse of buildQrValue, used only to pre-fill the edit form's
// content fields from a previously saved `data` string. A field that fails
// to match is left blank rather than throwing — a blank field the user can
// refill beats a broken edit page.
export function parseQrValue(type: QrType, data: string): QrFieldValues {
  const fields = { ...defaultQrFieldValues };

  switch (type) {
    case "URL":
      fields.url = data;
      break;
    case "TEXT":
      fields.text = data;
      break;
    case "EMAIL": {
      const match = data.match(/^mailto:([^?]*)(?:\?(.*))?$/);
      if (match) {
        fields.emailTo = match[1];
        const params = match[2] ? parseQuery(match[2]) : {};
        fields.emailSubject = params.subject ?? "";
        fields.emailBody = params.body ?? "";
      }
      break;
    }
    case "WIFI": {
      const match = data.match(/^WIFI:T:([^;]*);S:([^;]*);P:([^;]*);H:([^;]*);;$/);
      if (match) {
        fields.wifiEncryption = match[1];
        fields.wifiSsid = match[2];
        fields.wifiPassword = match[3];
        fields.wifiHidden = match[4] === "true";
      }
      break;
    }
    case "VCARD": {
      for (const line of data.split("\n")) {
        if (line.startsWith("N:")) {
          const [last, first] = line.slice(2).split(";");
          fields.vcardLastName = last ?? "";
          fields.vcardFirstName = first ?? "";
        } else if (line.startsWith("TEL:")) {
          fields.vcardPhone = line.slice(4);
        } else if (line.startsWith("EMAIL:")) {
          fields.vcardEmail = line.slice(6);
        } else if (line.startsWith("ORG:")) {
          fields.vcardOrg = line.slice(4);
        } else if (line.startsWith("TITLE:")) {
          fields.vcardTitle = line.slice(6);
        } else if (line.startsWith("URL:")) {
          fields.vcardWebsite = line.slice(4);
        }
      }
      break;
    }
    case "SMS": {
      const match = data.match(/^smsto:([^:]*):([\s\S]*)$/);
      if (match) {
        fields.smsPhone = match[1];
        fields.smsMessage = match[2];
      }
      break;
    }
    case "PHONE":
      fields.phone = data.replace(/^tel:/, "");
      break;
    case "LOCATION": {
      const match = data.match(/^geo:([^,]*),(.*)$/);
      if (match) {
        fields.lat = match[1];
        fields.lng = match[2];
      }
      break;
    }
    case "BITCOIN": {
      const match = data.match(/^bitcoin:([^?]*)(?:\?(.*))?$/);
      if (match) {
        fields.bitcoinAddress = match[1];
        const params = match[2] ? parseQuery(match[2]) : {};
        fields.bitcoinAmount = params.amount ?? "";
        fields.bitcoinLabel = params.label ?? "";
      }
      break;
    }
    case "WHATSAPP": {
      const match = data.match(/^https:\/\/wa\.me\/([^?]*)(?:\?(.*))?$/);
      if (match) {
        fields.whatsappPhone = match[1];
        const params = match[2] ? parseQuery(match[2]) : {};
        fields.whatsappMessage = params.text ?? "";
      }
      break;
    }
    case "EVENT": {
      for (const line of data.split("\n")) {
        if (line.startsWith("SUMMARY:")) {
          fields.eventTitle = line.slice(8);
        } else if (line.startsWith("DTSTART:")) {
          fields.eventStart = fromIcsDate(line.slice(8));
        } else if (line.startsWith("DTEND:")) {
          fields.eventEnd = fromIcsDate(line.slice(6));
        } else if (line.startsWith("LOCATION:")) {
          fields.eventLocation = line.slice(9);
        }
      }
      break;
    }
    case "PAYPAL": {
      const match = data.match(/^https:\/\/paypal\.me\/([^/]*)(?:\/(.*))?$/);
      if (match) {
        fields.paypalUsername = match[1];
        fields.paypalAmount = match[2] ?? "";
      }
      break;
    }
  }

  return fields;
}

export const qrFormSchema = z.object({
  name: z.string().trim().max(255).optional(),
  type: z.enum(qrTypes),
  data: z.string().trim().min(1, "Content is required").max(2000),
  fgColor: z.string().regex(hexColor),
  bgColor: z.string().regex(hexColor),
  size: z.number().int().min(128).max(1024),
  level: z.enum(errorCorrectionLevels),
  dotStyle: z.enum(dotStyles),
  finderFrameStyle: z.enum(finderStyles),
  finderMarkerStyle: z.enum(finderStyles),
  margin: z.number().int().min(0).max(10),
  logoDataUrl: z
    .string()
    .startsWith("data:image/")
    .max(500_000, "Logo image is too large")
    .optional(),
  logoSize: z.number().int().min(10).max(40),
});

export type QrFormValues = z.infer<typeof qrFormSchema>;
