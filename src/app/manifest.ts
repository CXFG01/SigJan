import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SignalRx",
    short_name: "SignalRx",
    description: "An anonymous prescription interaction checker with sourced investigations.",
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
