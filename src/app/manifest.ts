import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SignalRx",
    short_name: "SignalRx",
    description:
      "One accurate medication story, prepared for professional review.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3eb",
    theme_color: "#203341",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
