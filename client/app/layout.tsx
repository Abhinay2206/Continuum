import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Continuum — The Autonomous AI Operating System",
  description: "Enter the mind of an autonomous AI software engineer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
