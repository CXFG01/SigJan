import type { Metadata, Viewport } from "next";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "@fontsource-variable/literata";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SignalRx — Your health, organised around you",
    template: "%s · SignalRx",
  },
  description:
    "A private UK personal health organiser for medicines, symptoms, appointments, tests, and daily routines.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f6f3eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
