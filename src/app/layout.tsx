import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "EcoMind — AI Carbon Footprint Coach | Track, Understand & Reduce CO2",
  description:
    "EcoMind helps individuals understand, track, and reduce their carbon footprint through simple daily logging, Gemini-powered personalized insights, and weekly eco-challenges — tailored to Indian lifestyle.",
  keywords: [
    "carbon footprint tracker",
    "carbon coach",
    "CO2 reduction",
    "eco challenges",
    "sustainability app",
    "India carbon emissions",
    "Gemini AI insights",
    "green lifestyle",
  ],
  authors: [{ name: "EcoMind Team" }],
  openGraph: {
    title: "EcoMind — AI Carbon Footprint Coach",
    description:
      "Track your daily carbon footprint, get AI-powered insights from Gemini, and complete personalized eco-challenges.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} dark`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body antialiased pb-24 md:pb-0 pt-16 md:pt-24 min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 bg-primary text-on-primary px-4 py-2 rounded-xl shadow-lg border border-primary/20"
        >
          Skip to main content
        </a>
        <Navigation />
        <main id="main-content" role="main">
          {children}
        </main>
      </body>
    </html>
  );
}
