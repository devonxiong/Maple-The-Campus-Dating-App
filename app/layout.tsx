import type { Metadata, Viewport } from "next";
import "./globals.css";
import SupportButton from "./components/SupportButton";

export const metadata: Metadata = {
  title: "Maple — Campus Dating",
  description: "Meet the people you already almost know.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {children}
        <SupportButton />
      </body>
    </html>
  );
}
