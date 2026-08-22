import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ThemeProvider } from "next-themes";
import { CookieConsent } from "@/components/common/CookieConsent";
import { ErrorHandler } from "@/components/common/ErrorHandler";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://splinzo.in'),
  title: "Splinzo — Smart Expense Sharing",
  description: "The smartest way to split expenses with friends, roommates, and groups. Track who owes who and settle up effortlessly.",
  keywords: ["expense sharing", "split bills", "group expenses", "roommate ledger", "trip budgeting app", "bill splitter"],
  authors: [{ name: "Splinzo Team" }],
  openGraph: {
    title: "Splinzo — Smart Expense Sharing",
    description: "The smartest way to split expenses with friends, roommates, and groups. Track who owes who and settle up effortlessly.",
    url: "/",
    siteName: "Splinzo",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 1200,
        height: 630,
        alt: "Splinzo — Smart Expense Sharing",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Splinzo — Smart Expense Sharing",
    description: "The smartest way to split expenses with friends, roommates, and groups.",
    images: ["/icon.png"],
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "9xrsDkHKvEwqrLGex_g9ZOU-D1N9nH6h9Am8DxljcZw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9758730673684519"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased min-h-full flex flex-col`}
        style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorHandler />
          <AuthProvider>
            <AuthGuard>
              {children}
              <CookieConsent />
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
