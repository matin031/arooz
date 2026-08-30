import type { MetadataRoute } from "next";

const baseUrl = "https://aruzino.ir";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...[
      "/aruz",
      "/vazn-yab",
      "/game",
      "/game/jasoos",
      "/game/ninja",
      "/game/pairs",
      "/doroos",
      "/doroos/yazdahom",
      "/doroos/yazdahom/1",
      "/quiz",
    ].map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "/game" || path === "/vazn-yab" ? 0.9 : 0.8,
    })),
  ];
}
