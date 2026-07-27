"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QrFieldValues, QrType } from "@/lib/qr-schema";

type QrContentFieldsProps = {
  type: QrType;
  fields: QrFieldValues;
  onFieldChange: (key: keyof QrFieldValues, value: string | boolean) => void;
};

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function QrContentFields({ type, fields, onFieldChange }: QrContentFieldsProps) {
  const set =
    (key: keyof QrFieldValues) =>
    (value: string | boolean) =>
      onFieldChange(key, value);

  switch (type) {
    case "URL":
      return (
        <Field label="URL" htmlFor="qr-url">
          <Input
            id="qr-url"
            value={fields.url}
            onChange={(e) => set("url")(e.target.value)}
            placeholder="https://example.com"
          />
        </Field>
      );

    case "TEXT":
      return (
        <Field label="Text content" htmlFor="qr-text">
          <Textarea
            id="qr-text"
            rows={4}
            value={fields.text}
            onChange={(e) => set("text")(e.target.value)}
            placeholder="Enter your text here..."
          />
        </Field>
      );

    case "EMAIL":
      return (
        <div className="space-y-3">
          <Field label="To" htmlFor="qr-email-to">
            <Input
              id="qr-email-to"
              type="email"
              value={fields.emailTo}
              onChange={(e) => set("emailTo")(e.target.value)}
              placeholder="hello@example.com"
            />
          </Field>
          <Field label="Subject" htmlFor="qr-email-subject">
            <Input
              id="qr-email-subject"
              value={fields.emailSubject}
              onChange={(e) => set("emailSubject")(e.target.value)}
              placeholder="Subject line"
            />
          </Field>
          <Field label="Body" htmlFor="qr-email-body">
            <Textarea
              id="qr-email-body"
              rows={3}
              value={fields.emailBody}
              onChange={(e) => set("emailBody")(e.target.value)}
              placeholder="Message body..."
            />
          </Field>
        </div>
      );

    case "WIFI":
      return (
        <div className="space-y-3">
          <Field label="Network name (SSID)" htmlFor="qr-wifi-ssid">
            <Input
              id="qr-wifi-ssid"
              name="qr-wifi-ssid-no-autofill"
              autoComplete="off"
              value={fields.wifiSsid}
              onChange={(e) => set("wifiSsid")(e.target.value)}
              placeholder="My Network"
            />
          </Field>
          <Field label="Password" htmlFor="qr-wifi-password">
            <Input
              id="qr-wifi-password"
              name="qr-wifi-password-no-autofill"
              type="text"
              autoComplete="off"
              value={fields.wifiPassword}
              onChange={(e) => set("wifiPassword")(e.target.value)}
              placeholder="Network password"
            />
          </Field>
          <Field label="Encryption">
            <Select value={fields.wifiEncryption} onValueChange={(v) => set("wifiEncryption")(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA/WPA2</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">None (open)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Label className="font-mono text-xs font-normal text-muted-foreground">
            <input
              type="checkbox"
              checked={fields.wifiHidden}
              onChange={(e) => set("wifiHidden")(e.target.checked)}
              className="accent-primary size-3.5"
            />
            Hidden network
          </Label>
        </div>
      );

    case "VCARD":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="First name" htmlFor="qr-vcard-first">
              <Input
                id="qr-vcard-first"
                value={fields.vcardFirstName}
                onChange={(e) => set("vcardFirstName")(e.target.value)}
                placeholder="Jane"
              />
            </Field>
            <Field label="Last name" htmlFor="qr-vcard-last">
              <Input
                id="qr-vcard-last"
                value={fields.vcardLastName}
                onChange={(e) => set("vcardLastName")(e.target.value)}
                placeholder="Doe"
              />
            </Field>
          </div>
          <Field label="Phone" htmlFor="qr-vcard-phone">
            <Input
              id="qr-vcard-phone"
              value={fields.vcardPhone}
              onChange={(e) => set("vcardPhone")(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </Field>
          <Field label="Email" htmlFor="qr-vcard-email">
            <Input
              id="qr-vcard-email"
              type="email"
              value={fields.vcardEmail}
              onChange={(e) => set("vcardEmail")(e.target.value)}
              placeholder="jane@example.com"
            />
          </Field>
          <Field label="Organization" htmlFor="qr-vcard-org">
            <Input
              id="qr-vcard-org"
              value={fields.vcardOrg}
              onChange={(e) => set("vcardOrg")(e.target.value)}
              placeholder="Acme Corp"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Title" htmlFor="qr-vcard-title">
              <Input
                id="qr-vcard-title"
                value={fields.vcardTitle}
                onChange={(e) => set("vcardTitle")(e.target.value)}
                placeholder="Engineer"
              />
            </Field>
            <Field label="Website" htmlFor="qr-vcard-website">
              <Input
                id="qr-vcard-website"
                value={fields.vcardWebsite}
                onChange={(e) => set("vcardWebsite")(e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>
        </div>
      );

    case "SMS":
      return (
        <div className="space-y-3">
          <Field label="Phone number" htmlFor="qr-sms-phone">
            <Input
              id="qr-sms-phone"
              value={fields.smsPhone}
              onChange={(e) => set("smsPhone")(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </Field>
          <Field label="Message" htmlFor="qr-sms-message">
            <Textarea
              id="qr-sms-message"
              rows={3}
              value={fields.smsMessage}
              onChange={(e) => set("smsMessage")(e.target.value)}
              placeholder="Your message..."
            />
          </Field>
        </div>
      );

    case "PHONE":
      return (
        <Field label="Phone number" htmlFor="qr-phone">
          <Input
            id="qr-phone"
            value={fields.phone}
            onChange={(e) => set("phone")(e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </Field>
      );

    case "LOCATION":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Latitude" htmlFor="qr-lat">
              <Input
                id="qr-lat"
                value={fields.lat}
                onChange={(e) => set("lat")(e.target.value)}
                placeholder="37.7749"
              />
            </Field>
            <Field label="Longitude" htmlFor="qr-lng">
              <Input
                id="qr-lng"
                value={fields.lng}
                onChange={(e) => set("lng")(e.target.value)}
                placeholder="-122.4194"
              />
            </Field>
          </div>
          <p className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            geo:{fields.lat || "LAT"},{fields.lng || "LNG"}
          </p>
        </div>
      );

    case "BITCOIN":
      return (
        <div className="space-y-3">
          <Field label="Bitcoin address" htmlFor="qr-btc-address">
            <Input
              id="qr-btc-address"
              value={fields.bitcoinAddress}
              onChange={(e) => set("bitcoinAddress")(e.target.value)}
              placeholder="1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Amount (BTC)" htmlFor="qr-btc-amount">
              <Input
                id="qr-btc-amount"
                value={fields.bitcoinAmount}
                onChange={(e) => set("bitcoinAmount")(e.target.value)}
                placeholder="0.001"
              />
            </Field>
            <Field label="Label" htmlFor="qr-btc-label">
              <Input
                id="qr-btc-label"
                value={fields.bitcoinLabel}
                onChange={(e) => set("bitcoinLabel")(e.target.value)}
                placeholder="Payment"
              />
            </Field>
          </div>
        </div>
      );

    default:
      return null;
  }
}
