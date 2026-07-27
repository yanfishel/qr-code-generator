import { z } from "zod";

export const errorCorrectionLevels = ["L", "M", "Q", "H"] as const;
const hexColor = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

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

export const qrFormSchema = z.object({
  name: z.string().trim().max(255).optional(),
  type: z.enum(qrTypes),
  data: z.string().trim().min(1, "Content is required").max(2000),
  fgColor: z.string().regex(hexColor),
  bgColor: z.string().regex(hexColor),
  size: z.number().int().min(128).max(1024),
  level: z.enum(errorCorrectionLevels),
  margin: z.number().int().min(0).max(10),
  logoDataUrl: z
    .string()
    .startsWith("data:image/")
    .max(500_000, "Logo image is too large")
    .optional(),
  logoSize: z.number().int().min(10).max(40),
});

export type QrFormValues = z.infer<typeof qrFormSchema>;
