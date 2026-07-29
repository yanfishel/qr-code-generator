import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/saved", "/sign-in", "/sign-up"],
    },
    sitemap: "https://qrframe.pro/sitemap.xml",
  };
}
