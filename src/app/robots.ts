import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.splinzo.in';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/blog',
          '/blog/*',
          '/contact',
          '/privacy-policy',
          '/terms',
          '/login',
          '/signup',
          '/manifest.webmanifest',
          '/opengraph-image.png',
          '/icon.png',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/groups',
          '/groups/*',
          '/admin',
          '/admin/*',
          '/call',
          '/call/*',
          '/g/*',
          '/join/*',
          '/api/*',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
