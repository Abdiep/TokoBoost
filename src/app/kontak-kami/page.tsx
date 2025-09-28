import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactUsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 md:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Kontak Kami</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              Punya pertanyaan atau masukan? Jangan ragu untuk menghubungi kami melalui formulir di bawah ini atau email kami langsung di <a href="mailto:support@tokoboost.com" className="underline text-primary">support@tokoboost.com</a>.
            </p>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input id="name" placeholder="Nama Anda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@anda.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subjek</Label>
                <Input id="subject" placeholder="Subjek pesan Anda" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Pesan</Label>
                <Textarea id="message" placeholder="Tulis pesan Anda di sini..." rows={5} />
              </div>
              <Button type="submit">Kirim Pesan</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
