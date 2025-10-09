'use client';

import Link from 'next/link';
import { Wand2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Wand2 className="h-7 w-7 text-primary" />
              <span className="font-headline text-2xl font-bold">BrosurAI</span>
            </Link>
            <p className="text-sm">
              Bikin produk jadi kece.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary transition-colors">Beranda</Link></li>
              <li><Link href="/tentang-kami" className="hover:text-primary transition-colors">Tentang Kami</Link></li>
              <li><Link href="/kontak-kami" className="hover:text-primary transition-colors">Kontak Kami</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privasi" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/syarat-dan-ketentuan" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
           <div>
            <h4 className="font-semibold mb-4">Kontak</h4>
            <p className="text-sm">
                Email <a href="mailto:support@tokoboost.com" className="underline hover:text-primary">support@tokoboost.com</a>
            </p>
          </div>
        </div>
        <div className="border-t border-muted mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BrosurAI. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
