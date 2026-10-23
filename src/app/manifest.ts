import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SimeHelp — Sime Darby Property Community Marketplace",
    short_name: "SimeHelp",
    description: "A verified, township-only marketplace where residents help each other.",
    start_url: "/",
    display: "standalone",
    background_color: "#efedeb",
    theme_color: "#c8102e",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
