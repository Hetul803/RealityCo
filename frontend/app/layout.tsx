import "@/styles/globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reality Copilot",
  description: "A live voice-and-vision assistant for the real world.",
  icons: [{ rel: "icon", url: "/favicon.svg" }]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
