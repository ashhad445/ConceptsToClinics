import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ConceptsToClinics — Private Online Lectures by Aftab",
  description:
    "Master Biology & Medical Sciences with expert online lectures by Aftab. Private, high-definition lecture platform with flexible course access for medical aspirants.",
  keywords: [
    "Biology Tutor",
    "Medical Science Lectures",
    "Aftab Tutor",
    "ConceptsToClinics",
    "Online Biology Classes",
    "Medical Entry Test Prep",
    "Private Tutoring Pakistan",
  ],
  authors: [{ name: "Aftab", url: "https://conceptstoclinics.com" }],
  openGraph: {
    title: "ConceptsToClinics — Private Online Lectures by Aftab",
    description:
      "Expert-led online medical & biology lectures with high-definition video learning and mobile access.",
    url: "https://conceptstoclinics.com",
    siteName: "ConceptsToClinics",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConceptsToClinics — Private Online Lectures by Aftab",
    description:
      "Expert-led online medical & biology lectures with high-definition video learning and mobile access.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-gray-950 text-gray-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
