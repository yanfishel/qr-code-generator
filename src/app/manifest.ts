import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QRFrame — Custom QR Code Generator",
    short_name: "QRFrame",
    description: "Design, customize, and save QR codes with colors, logos, and custom shapes.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8F5",
    theme_color: "#0E9E92",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
