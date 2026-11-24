import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Pharminvin — Smart Pharmacy Inventory & Patient Care Platform",
  description:
    "Spatial 3D AI-powered pharmacy inventory, FEFO automation, IoT cold-chain telemetry, procurement optimization, and digital patient care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans min-h-screen overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
