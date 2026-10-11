import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/developer",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api/", "/developer"],
      },
    ],
    sitemap: "https://netduniya.in/sitemap.xml",
    host: "https://netduniya.in",
  };
}
