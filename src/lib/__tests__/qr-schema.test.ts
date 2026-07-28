import { describe, it, expect } from "vitest";
import { buildQrValue, defaultQrFieldValues, parseQrValue, type QrFieldValues } from "@/lib/qr-schema";

function fields(overrides: Partial<QrFieldValues>): QrFieldValues {
  return { ...defaultQrFieldValues, ...overrides };
}

describe("buildQrValue", () => {
  it("trims URL content", () => {
    expect(buildQrValue("URL", fields({ url: "  https://claude.ai  " }))).toBe(
      "https://claude.ai",
    );
  });

  it("trims TEXT content", () => {
    expect(buildQrValue("TEXT", fields({ text: "  hello  " }))).toBe("hello");
  });

  describe("EMAIL", () => {
    it("returns empty string without a recipient", () => {
      expect(buildQrValue("EMAIL", fields({ emailTo: "" }))).toBe("");
    });

    it("builds a bare mailto link with no subject/body", () => {
      expect(buildQrValue("EMAIL", fields({ emailTo: "a@b.com" }))).toBe("mailto:a@b.com");
    });

    it("appends encoded subject and body as query params", () => {
      expect(
        buildQrValue(
          "EMAIL",
          fields({ emailTo: "a@b.com", emailSubject: "Hi there", emailBody: "How are you?" }),
        ),
      ).toBe("mailto:a@b.com?subject=Hi%20there&body=How%20are%20you%3F");
    });
  });

  describe("WIFI", () => {
    it("returns empty string without an SSID", () => {
      expect(buildQrValue("WIFI", fields({ wifiSsid: "" }))).toBe("");
    });

    it("builds a WIFI: string with encryption, password, and hidden flag", () => {
      expect(
        buildQrValue(
          "WIFI",
          fields({
            wifiSsid: "MyNet",
            wifiPassword: "secret",
            wifiEncryption: "WPA",
            wifiHidden: true,
          }),
        ),
      ).toBe("WIFI:T:WPA;S:MyNet;P:secret;H:true;;");
    });
  });

  describe("VCARD", () => {
    it("returns empty string without a name", () => {
      expect(
        buildQrValue("VCARD", fields({ vcardFirstName: "", vcardLastName: "" })),
      ).toBe("");
    });

    it("builds a vCard block with only the provided fields", () => {
      const value = buildQrValue(
        "VCARD",
        fields({ vcardFirstName: "Jane", vcardLastName: "Doe", vcardPhone: "+1 555 0000" }),
      );
      expect(value).toBe(
        ["BEGIN:VCARD", "VERSION:3.0", "N:Doe;Jane", "FN:Jane Doe", "TEL:+1 555 0000", "END:VCARD"].join(
          "\n",
        ),
      );
    });

    it("omits ORG/TITLE/URL/EMAIL lines when not provided", () => {
      const value = buildQrValue("VCARD", fields({ vcardFirstName: "Jane", vcardLastName: "" }));
      expect(value).not.toContain("ORG:");
      expect(value).not.toContain("TITLE:");
      expect(value).not.toContain("EMAIL:");
      expect(value).not.toContain("URL:");
    });
  });

  describe("SMS", () => {
    it("returns empty string without a phone number", () => {
      expect(buildQrValue("SMS", fields({ smsPhone: "" }))).toBe("");
    });

    it("builds an smsto: link with the message", () => {
      expect(buildQrValue("SMS", fields({ smsPhone: "+1555", smsMessage: "hi" }))).toBe(
        "smsto:+1555:hi",
      );
    });
  });

  describe("PHONE", () => {
    it("returns empty string without a number", () => {
      expect(buildQrValue("PHONE", fields({ phone: "" }))).toBe("");
    });

    it("builds a tel: link", () => {
      expect(buildQrValue("PHONE", fields({ phone: "+1 555 0000" }))).toBe("tel:+1 555 0000");
    });
  });

  describe("LOCATION", () => {
    it("returns empty string when either coordinate is missing", () => {
      expect(buildQrValue("LOCATION", fields({ lat: "37.7", lng: "" }))).toBe("");
      expect(buildQrValue("LOCATION", fields({ lat: "", lng: "-122.4" }))).toBe("");
    });

    it("builds a geo: link", () => {
      expect(buildQrValue("LOCATION", fields({ lat: "37.7", lng: "-122.4" }))).toBe(
        "geo:37.7,-122.4",
      );
    });
  });

  describe("BITCOIN", () => {
    it("returns empty string without an address", () => {
      expect(buildQrValue("BITCOIN", fields({ bitcoinAddress: "" }))).toBe("");
    });

    it("builds a bare bitcoin: link with no amount/label", () => {
      expect(buildQrValue("BITCOIN", fields({ bitcoinAddress: "1Abc" }))).toBe("bitcoin:1Abc");
    });

    it("appends amount and encoded label as query params", () => {
      expect(
        buildQrValue(
          "BITCOIN",
          fields({ bitcoinAddress: "1Abc", bitcoinAmount: "0.5", bitcoinLabel: "Coffee & tea" }),
        ),
      ).toBe("bitcoin:1Abc?amount=0.5&label=Coffee%20%26%20tea");
    });
  });

  describe("WHATSAPP", () => {
    it("returns empty string without a phone number", () => {
      expect(buildQrValue("WHATSAPP", fields({ whatsappPhone: "" }))).toBe("");
    });

    it("strips non-digit characters from the phone number", () => {
      expect(buildQrValue("WHATSAPP", fields({ whatsappPhone: "+1 (555) 123-4567" }))).toBe(
        "https://wa.me/15551234567",
      );
    });

    it("appends an encoded message as a query param when present", () => {
      expect(
        buildQrValue("WHATSAPP", fields({ whatsappPhone: "15551234567", whatsappMessage: "hi there" })),
      ).toBe("https://wa.me/15551234567?text=hi%20there");
    });
  });

  describe("EVENT", () => {
    it("returns empty string without a title or start time", () => {
      expect(buildQrValue("EVENT", fields({ eventTitle: "", eventStart: "2026-06-01T10:00" }))).toBe(
        "",
      );
      expect(buildQrValue("EVENT", fields({ eventTitle: "Meeting", eventStart: "" }))).toBe("");
    });

    it("builds a VCALENDAR/VEVENT block with formatted DTSTART", () => {
      const value = buildQrValue(
        "EVENT",
        fields({ eventTitle: "Team meeting", eventStart: "2026-06-01T10:00" }),
      );
      expect(value).toBe(
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          "SUMMARY:Team meeting",
          "DTSTART:20260601T100000",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\n"),
      );
    });

    it("includes DTEND and LOCATION only when provided", () => {
      const value = buildQrValue(
        "EVENT",
        fields({
          eventTitle: "Team meeting",
          eventStart: "2026-06-01T10:00",
          eventEnd: "2026-06-01T11:00",
          eventLocation: "Room 1",
        }),
      );
      expect(value).toContain("DTEND:20260601T110000");
      expect(value).toContain("LOCATION:Room 1");
    });
  });

  describe("PAYPAL", () => {
    it("returns empty string without a username", () => {
      expect(buildQrValue("PAYPAL", fields({ paypalUsername: "" }))).toBe("");
    });

    it("builds a bare paypal.me link with no amount", () => {
      expect(buildQrValue("PAYPAL", fields({ paypalUsername: "janedoe" }))).toBe(
        "https://paypal.me/janedoe",
      );
    });

    it("appends the amount as a path segment when present", () => {
      expect(buildQrValue("PAYPAL", fields({ paypalUsername: "janedoe", paypalAmount: "10.00" }))).toBe(
        "https://paypal.me/janedoe/10.00",
      );
    });
  });
});

describe("parseQrValue", () => {
  it("round-trips URL and TEXT", () => {
    expect(parseQrValue("URL", "https://claude.ai").url).toBe("https://claude.ai");
    expect(parseQrValue("TEXT", "hello world").text).toBe("hello world");
  });

  it("round-trips EMAIL with subject and body", () => {
    const data = buildQrValue(
      "EMAIL",
      fields({ emailTo: "a@b.com", emailSubject: "Hi there", emailBody: "How are you?" }),
    );
    const parsed = parseQrValue("EMAIL", data);
    expect(parsed.emailTo).toBe("a@b.com");
    expect(parsed.emailSubject).toBe("Hi there");
    expect(parsed.emailBody).toBe("How are you?");
  });

  it("round-trips WIFI", () => {
    const data = buildQrValue(
      "WIFI",
      fields({ wifiSsid: "MyNet", wifiPassword: "secret", wifiEncryption: "WPA", wifiHidden: true }),
    );
    const parsed = parseQrValue("WIFI", data);
    expect(parsed.wifiSsid).toBe("MyNet");
    expect(parsed.wifiPassword).toBe("secret");
    expect(parsed.wifiEncryption).toBe("WPA");
    expect(parsed.wifiHidden).toBe(true);
  });

  it("round-trips VCARD", () => {
    const data = buildQrValue(
      "VCARD",
      fields({
        vcardFirstName: "Jane",
        vcardLastName: "Doe",
        vcardPhone: "+1 555 0000",
        vcardEmail: "jane@doe.com",
        vcardOrg: "Acme",
        vcardTitle: "Engineer",
        vcardWebsite: "https://jane.dev",
      }),
    );
    const parsed = parseQrValue("VCARD", data);
    expect(parsed.vcardFirstName).toBe("Jane");
    expect(parsed.vcardLastName).toBe("Doe");
    expect(parsed.vcardPhone).toBe("+1 555 0000");
    expect(parsed.vcardEmail).toBe("jane@doe.com");
    expect(parsed.vcardOrg).toBe("Acme");
    expect(parsed.vcardTitle).toBe("Engineer");
    expect(parsed.vcardWebsite).toBe("https://jane.dev");
  });

  it("round-trips SMS", () => {
    const data = buildQrValue("SMS", fields({ smsPhone: "+1555", smsMessage: "hi" }));
    const parsed = parseQrValue("SMS", data);
    expect(parsed.smsPhone).toBe("+1555");
    expect(parsed.smsMessage).toBe("hi");
  });

  it("round-trips PHONE", () => {
    expect(parseQrValue("PHONE", "tel:+1 555 0000").phone).toBe("+1 555 0000");
  });

  it("round-trips LOCATION", () => {
    const parsed = parseQrValue("LOCATION", "geo:37.7,-122.4");
    expect(parsed.lat).toBe("37.7");
    expect(parsed.lng).toBe("-122.4");
  });

  it("round-trips BITCOIN", () => {
    const data = buildQrValue(
      "BITCOIN",
      fields({ bitcoinAddress: "1Abc", bitcoinAmount: "0.5", bitcoinLabel: "Coffee & tea" }),
    );
    const parsed = parseQrValue("BITCOIN", data);
    expect(parsed.bitcoinAddress).toBe("1Abc");
    expect(parsed.bitcoinAmount).toBe("0.5");
    expect(parsed.bitcoinLabel).toBe("Coffee & tea");
  });

  it("round-trips WHATSAPP", () => {
    const data = buildQrValue(
      "WHATSAPP",
      fields({ whatsappPhone: "15551234567", whatsappMessage: "hi there" }),
    );
    const parsed = parseQrValue("WHATSAPP", data);
    expect(parsed.whatsappPhone).toBe("15551234567");
    expect(parsed.whatsappMessage).toBe("hi there");
  });

  it("round-trips EVENT", () => {
    const data = buildQrValue(
      "EVENT",
      fields({
        eventTitle: "Team meeting",
        eventStart: "2026-06-01T10:00",
        eventEnd: "2026-06-01T11:00",
        eventLocation: "Room 1",
      }),
    );
    const parsed = parseQrValue("EVENT", data);
    expect(parsed.eventTitle).toBe("Team meeting");
    expect(parsed.eventStart).toBe("2026-06-01T10:00");
    expect(parsed.eventEnd).toBe("2026-06-01T11:00");
    expect(parsed.eventLocation).toBe("Room 1");
  });

  it("round-trips PAYPAL", () => {
    const data = buildQrValue("PAYPAL", fields({ paypalUsername: "janedoe", paypalAmount: "10.00" }));
    const parsed = parseQrValue("PAYPAL", data);
    expect(parsed.paypalUsername).toBe("janedoe");
    expect(parsed.paypalAmount).toBe("10.00");
  });

  it("leaves fields blank when the data does not match the expected shape", () => {
    const parsed = parseQrValue("WIFI", "not a wifi string");
    expect(parsed.wifiSsid).toBe("");
  });
});
