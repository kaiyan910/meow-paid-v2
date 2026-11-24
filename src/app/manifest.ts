import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeowPaid",
    short_name: "MeowPaid",
    description: "Expense tracking and splitting app",
    theme_color: "#1a1a1a",
    background_color: "#f5f0e8",
    display: "standalone",
    start_url: "/",
    scope: "/",
    icons: [
      { src: "/icons/icons-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icons-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icons-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
