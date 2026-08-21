import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://splinzo.in';
  
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/signup', '/privacy-policy', '/terms', '/contact'],
      disallow: ['/dashboard', '/groups', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
