import type { Metadata } from 'next';
import './globals.css';
import { AppContextProvider } from '@/contexts/AppContext';
import { Toaster } from '@/components/ui/toaster';
import Footer from '@/components/Footer';
import Script from 'next/script';

const siteConfig = {
  name: "TokoBoost",
  url: "https://tokoboost.com",
  description: "Tingkatkan pemasaran UMKM Anda. Buat desain flyer produk dan caption media sosial secara otomatis dengan kekuatan AI. Cepat, mudah, dan profesional.",
  ogImage: "https://tokoboost.com/og-image.png", // Ganti dengan URL gambar OG Anda nanti
  links: {
    twitter: "https://twitter.com/tokoboost", // Ganti dengan link twitter Anda nanti
  },
}

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | Buat Desain & Caption Promosi dengan AI`,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "AI marketing",
    "desain promosi",
    "caption otomatis",
    "UMKM Indonesia",
    "konten marketing",
    "flyer produk",
    "social media marketing",
    "kecerdasan buatan",
  ],
  authors: [
    {
      name: "TokoBoost Team",
      url: siteConfig.url,
    },
  ],
  creator: "TokoBoost Team",
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@tokoboost", // Ganti dengan handle twitter Anda nanti
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="text/javascript"
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        ></script>
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <AppContextProvider>
          <div className="flex-grow">{children}</div>
          <Footer />
          <Toaster />
        </AppContextProvider>
      </body>
    </html>
  );
}
