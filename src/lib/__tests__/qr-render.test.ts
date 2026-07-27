import { describe, it, expect } from "vitest";
import QRCode from "qrcode";
import { buildQrLayout, FINDER_SIZE } from "@/lib/qr-render";

function isInFinderRegion(row: number, col: number, moduleCount: number): boolean {
  return (
    (row < FINDER_SIZE && col < FINDER_SIZE) ||
    (row < FINDER_SIZE && col >= moduleCount - FINDER_SIZE) ||
    (row >= moduleCount - FINDER_SIZE && col < FINDER_SIZE)
  );
}

describe("buildQrLayout", () => {
  it("sizes numCells as the module count plus margin on both sides", () => {
    const qr = QRCode.create("https://example.com", { errorCorrectionLevel: "M" });
    const moduleCount = qr.modules.size;

    const layout = buildQrLayout({ value: "https://example.com", level: "M", size: 256, margin: 3 });

    expect(layout.numCells).toBe(moduleCount + 6);
    expect(layout.margin).toBe(3);
  });

  it("excludes every finder-region module from the data module list", () => {
    const layout = buildQrLayout({ value: "https://example.com", level: "M", size: 256, margin: 0 });
    const moduleCount = layout.numCells;

    for (const mod of layout.modules) {
      expect(isInFinderRegion(mod.row, mod.col, moduleCount)).toBe(false);
    }
  });

  it("returns exactly three finder origins at the top-left, top-right, and bottom-left corners", () => {
    const layout = buildQrLayout({ value: "https://example.com", level: "M", size: 256, margin: 0 });
    const moduleCount = layout.numCells;

    expect(layout.finderOrigins).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: moduleCount - FINDER_SIZE },
      { row: moduleCount - FINDER_SIZE, col: 0 },
    ]);
  });

  it("returns no image layout when imageSettings is omitted", () => {
    const layout = buildQrLayout({ value: "https://example.com", level: "M", size: 256, margin: 2 });
    expect(layout.image).toBeNull();
  });

  it("computes the image box in module units from a pixel width/height", () => {
    const layout = buildQrLayout({
      value: "https://example.com",
      level: "M",
      size: 256,
      margin: 0,
      imageSettings: { src: "data:image/png;base64,x", width: 51.2, height: 51.2 },
    });

    // width/height are given in pixels against `size`; converted to module units
    // via (numCells / size), then centered.
    const expectedW = 51.2 * (layout.numCells / 256);
    expect(layout.image?.w).toBeCloseTo(expectedW, 5);
    expect(layout.image?.h).toBeCloseTo(expectedW, 5);
    expect(layout.image?.x).toBeCloseTo(layout.numCells / 2 - expectedW / 2, 4);
  });

  it("excavates modules under the logo when excavate is set", () => {
    const withoutLogo = buildQrLayout({ value: "https://example.com", level: "H", size: 256, margin: 0 });
    const withLogo = buildQrLayout({
      value: "https://example.com",
      level: "H",
      size: 256,
      margin: 0,
      imageSettings: { src: "data:image/png;base64,x", width: 76.8, height: 76.8, excavate: true },
    });

    expect(withLogo.modules.length).toBeLessThan(withoutLogo.modules.length);
  });

  it("does not excavate modules when excavate is false", () => {
    const withoutExcavate = buildQrLayout({ value: "https://example.com", level: "H", size: 256, margin: 0 });
    const withImageNoExcavate = buildQrLayout({
      value: "https://example.com",
      level: "H",
      size: 256,
      margin: 0,
      imageSettings: { src: "data:image/png;base64,x", width: 76.8, height: 76.8, excavate: false },
    });

    expect(withImageNoExcavate.modules.length).toBe(withoutExcavate.modules.length);
  });

  it("never excavates a finder pattern (finder module count is style-independent)", () => {
    const layout = buildQrLayout({
      value: "https://example.com",
      level: "H",
      size: 256,
      margin: 0,
      imageSettings: { src: "data:image/png;base64,x", width: 76.8, height: 76.8, excavate: true },
    });

    // Always exactly three finder origins regardless of logo excavation.
    expect(layout.finderOrigins).toHaveLength(3);
  });
});
