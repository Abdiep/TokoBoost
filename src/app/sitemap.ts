import type { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tokoboost.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://tokoboost.com/tentang-kami',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://tokoboost.com/kontak-kami',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
     {
      url: 'https://tokoboost.com/privasi',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
     {
      url: 'https://tokoboost.com/syarat-dan-ketentuan',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
