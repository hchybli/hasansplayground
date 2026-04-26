import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hasan's Playground",
  description: "Hasan's projects, interests, and creative work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
