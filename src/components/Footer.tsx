'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-transparent text-secondary-foreground border-t border-white/10 mt-16">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="TokoBoost AI Logo" width={32} height={32} className="h-8 w-8" />
              <span className="font-headline text-2xl font-bold text-white">TokoBoost-AI</span>
            </Link>
            <p className="text-base italic text-white/60">
              Bikin produk jadi kece.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Navigasi</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/" className="hover:text-primary transition-colors">Beranda</Link></li>
              <li><Link href="/tentang-kami" className="hover:text-primary transition-colors">Tentang Kami</Link></li>
              <li><Link href="/kontak-kami" className="hover:text-primary transition-colors">Kontak Kami</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/privasi" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/syarat-dan-ketentuan" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
           <div>
            <h4 className="font-semibold mb-4 text-white">Kontak</h4>
            <p className="text-sm text-white/80">
                Email <a href="mailto:support@tokoboost.com" className="underline hover:text-primary">support@tokoboost.com</a>
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TokoBoost AI. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
