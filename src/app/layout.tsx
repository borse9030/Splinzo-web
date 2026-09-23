import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsent } from "@/components/common/CookieConsent";
import { ErrorHandler } from "@/components/common/ErrorHandler";
import { CallProvider } from "@/contexts/CallContext";
import { GlobalCallOverlay } from "@/components/call/GlobalCallOverlay";
import { CallAudioRenderer } from "@/components/call/CallAudioRenderer";
import { OrganizationSchema, WebApplicationSchema, FaqSchema } from "@/components/seo/JsonLd";
import { FAQS } from "@/data/faqs";

// Suppress known false-positive React 19 warning for next-themes inline script in development
if (process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.splinzo.in'),
  title: {
    default: "Splinzo — Smart Expense Sharing & Group Bill Splitter",
    template: "%s | Splinzo",
  },
  description: "The smartest way to split expenses with friends, roommates, and groups. Automated zero-sum settlement calculations, UPI payment links, and offline-first expense tracking.",
  keywords: [
    "expense sharing app",
    "split bills with friends",
    "group expenses tracker",
    "splitwise alternative",
    "splitwise free alternative",
    "roommate expense manager",
    "trip budgeting app",
    "bill splitter india",
    "upi bill split",
    "settle up upi",
    "shared expenses calculator",
    "zero sum debt settlement",
    "group travel budget",
    "flatmate rent splitter",
  ],
  authors: [{ name: "Splinzo Team", url: "https://www.splinzo.in" }],
  creator: "Splinzo",
  publisher: "Splinzo",
  category: "finance",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Splinzo — Smart Expense Sharing & Group Bill Splitter",
    description: "The smartest way to split expenses with friends, roommates, and groups. Automated zero-sum settlement and UPI payment tracking.",
    url: "/",
    siteName: "Splinzo",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Splinzo — Smart Expense Sharing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Splinzo — Smart Expense Sharing & Group Bill Splitter",
    description: "The smartest way to split expenses with friends, roommates, and groups.",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "9xrsDkHKvEwqrLGex_g9ZOU-D1N9nH6h9Am8DxljcZw",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className="overflow-x-clip max-w-full">
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased min-h-full flex flex-col w-full max-w-full overflow-x-clip`}
        style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
      >
        <OrganizationSchema />
        <WebApplicationSchema />
        <FaqSchema faqs={FAQS} />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ErrorHandler />
          <AuthProvider>
            <AuthGuard>
              <CallProvider>
                <CallAudioRenderer />
                <GlobalCallOverlay />
                {children}
                <CookieConsent />
              </CallProvider>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
