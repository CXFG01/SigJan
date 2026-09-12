import type { Metadata, Viewport } from "next";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "@fontsource-variable/literata";
import "./globals.css";
import "@/styles/checker.css";

export const metadata: Metadata = {
  title: {
    default: "SignalRx — Understand your prescription",
    template: "%s · SignalRx",
  },
  description:
    "Check documented medicine interactions and investigate uncertain evidence. An anonymous UK prototype.",
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
