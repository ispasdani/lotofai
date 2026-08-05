import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./providers/ConvexClientProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lotofai — Lottery insights for entertainment",
  description: "Explore historical Romanian lottery draws, discover number patterns, and generate AI-assisted lucky combinations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><ConvexClientProvider>{children}</ConvexClientProvider></body>
    </html>
  );
}

