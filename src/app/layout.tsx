import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ThemeProvider } from "next-themes";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://splinzo-web-sandy.vercel.app'),
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased min-h-full flex flex-col`}
        style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
