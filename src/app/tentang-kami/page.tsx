'use client';

import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutUsPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Tentang Kami</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            Selamat datang di TokoBoost! Kami adalah platform revolusioner yang membantu para pelaku usaha, terutama UMKM, untuk membuat materi promosi yang menarik dan profesional dengan mudah menggunakan kekuatan kecerdasan buatan (AI).
                        </p>
                        <p>
                            Misi kami adalah memberdayakan bisnis untuk bertumbuh dengan menyediakan alat pemasaran yang canggih, terjangkau, dan mudah digunakan. Kami percaya bahwa setiap produk hebat berhak mendapatkan promosi yang hebat pula.
                        </p>
                        <h2 className="font-headline text-2xl pt-4">Tim Kami</h2>
                        <p>
                           Tim kami terdiri dari para profesional di bidang teknologi, desain, dan pemasaran yang bersemangat untuk membantu Anda sukses.
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
