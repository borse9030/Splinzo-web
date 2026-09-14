import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support & Helpdesk",
  description: "Get in touch with the Splinzo team. Submit support tickets, ask billing and settlement questions, or report issues.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Splinzo Support & Helpdesk",
    description: "Need help splitting bills or tracking payments? Contact the Splinzo support team.",
    url: "/contact",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Contact Splinzo Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Splinzo Support & Helpdesk",
    description: "Get in touch with the Splinzo team for support, feedback, and questions.",
    images: ["/opengraph-image.png"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
