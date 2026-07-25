import type { Metadata, Viewport } from "next";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "@fontsource-variable/literata";
import "./globals.css";
import "@/styles/app-shell.css";
import "@/styles/content-pages.css";
import "@/styles/patient-workflow.css";
import "@/styles/professional-workflow.css";
import "@/styles/clinical.css";
import { DemoProvider } from "@/context/demo-provider";

export const metadata: Metadata = {
  title: {
    default: "SignalRx — One accurate medication story",
    template: "%s · SignalRx",
  },
  description:
    "Bring medicines, vitamins, supplements, and actual use into one source-backed medication review.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f6f3eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
