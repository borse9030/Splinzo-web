import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.splinzo.in';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/blog', '/login', '/signup', '/privacy-policy', '/terms', '/contact', '/ads.txt'],
        disallow: ['/dashboard', '/groups', '/api'],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
