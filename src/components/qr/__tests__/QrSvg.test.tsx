import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { QrSvg } from "@/components/qr/QrSvg";
import { buildQrLayout } from "@/lib/qr-render";

const baseProps = {
  value: "https://example.com",
  size: 256,
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  level: "M" as const,
  marginSize: 2,
  finderFrameStyle: "SQUARE" as const,
  finderMarkerStyle: "SQUARE" as const,
};

describe("QrSvg", () => {
  it("renders nothing for an empty value", () => {
    const { container } = render(<QrSvg {...baseProps} value="" dotStyle="SQUARE" />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("draws SQUARE data modules as a single merged path (no per-module elements)", () => {
    const { container } = render(<QrSvg {...baseProps} dotStyle="SQUARE" />);

    expect(container.querySelectorAll("circle")).toHaveLength(0);
    expect(container.querySelectorAll("polygon")).toHaveLength(0);
    // background path + merged data-module path + 3 finder frame paths
    expect(container.querySelectorAll("path")).toHaveLength(5);
  });

  it("draws DOTS data modules as individual circles matching the module count", () => {
    const layout = buildQrLayout({ value: baseProps.value, level: baseProps.level, size: baseProps.size, margin: baseProps.marginSize });
    const { container } = render(<QrSvg {...baseProps} dotStyle="DOTS" finderMarkerStyle="SQUARE" />);

    expect(container.querySelectorAll("circle")).toHaveLength(layout.modules.length);
  });

  it("draws CLASSY data modules as polygons matching the module count", () => {
    const layout = buildQrLayout({ value: baseProps.value, level: baseProps.level, size: baseProps.size, margin: baseProps.marginSize });
    const { container } = render(<QrSvg {...baseProps} dotStyle="CLASSY" />);

    expect(container.querySelectorAll("polygon")).toHaveLength(layout.modules.length);
  });

  it("always renders exactly three finder frames and three markers regardless of dot style", () => {
    for (const dotStyle of ["SQUARE", "ROUNDED", "DOTS", "CLASSY"] as const) {
      const { container } = render(
        <QrSvg {...baseProps} dotStyle={dotStyle} finderMarkerStyle="CIRCLE" />,
      );
      // 3 marker circles, independent of how many data-module circles DOTS adds
      const markerRadius = "1.4";
      const markers = Array.from(container.querySelectorAll("circle")).filter(
        (el) => el.getAttribute("r") === markerRadius,
      );
      expect(markers).toHaveLength(3);
    }
  });

  it("renders finder frames as square paths without arc commands for the SQUARE style", () => {
    const { container } = render(<QrSvg {...baseProps} dotStyle="SQUARE" finderFrameStyle="SQUARE" />);
    const paths = Array.from(container.querySelectorAll("path"));
    // the merged data-module path is one of the 5; frame paths use two rect subpaths (no "A" arc command)
    const framePaths = paths.filter((p) => (p.getAttribute("d") ?? "").split("M").length === 3);
    expect(framePaths).toHaveLength(3);
    for (const frame of framePaths) {
      expect(frame.getAttribute("d")).not.toContain("A");
    }
  });

  it("renders finder frames with arc commands for the CIRCLE style", () => {
    const { container } = render(<QrSvg {...baseProps} dotStyle="SQUARE" finderFrameStyle="CIRCLE" />);
    const paths = Array.from(container.querySelectorAll("path"));
    const framePaths = paths.filter((p) => (p.getAttribute("d") ?? "").includes("A"));
    expect(framePaths).toHaveLength(3);
  });

  it("renders finder markers as plain rects for SQUARE and circles for CIRCLE", () => {
    const { container: squareContainer } = render(
      <QrSvg {...baseProps} dotStyle="SQUARE" finderMarkerStyle="SQUARE" />,
    );
    const squareMarkers = Array.from(squareContainer.querySelectorAll("rect")).filter(
      (el) => el.getAttribute("width") === "3",
    );
    expect(squareMarkers).toHaveLength(3);

    const { container: circleContainer } = render(
      <QrSvg {...baseProps} dotStyle="SQUARE" finderMarkerStyle="CIRCLE" />,
    );
    const circleMarkers = Array.from(circleContainer.querySelectorAll("circle")).filter(
      (el) => el.getAttribute("r") === "1.4",
    );
    expect(circleMarkers).toHaveLength(3);
  });

  it("renders the embedded logo image when imageSettings is provided", () => {
    const { container } = render(
      <QrSvg
        {...baseProps}
        dotStyle="SQUARE"
        imageSettings={{ src: "data:image/png;base64,x", width: 40, height: 40, excavate: true }}
      />,
    );
    const image = container.querySelector("image");
    expect(image).not.toBeNull();
    expect(image?.getAttribute("href")).toBe("data:image/png;base64,x");
  });
});
