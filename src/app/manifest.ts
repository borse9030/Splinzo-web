import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Splinzo — Smart Expense Sharing',
    short_name: 'Splinzo',
    description: 'The smartest way to split expenses with friends, roommates, and groups. Fast, fair, and seamless bill splitting.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#F9B912',
    categories: ['finance', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
