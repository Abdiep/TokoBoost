'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useTransition } from 'react';

import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama harus diisi." }),
  email: z.string().email({ message: "Format email tidak valid." }),
  subject: z.string().min(5, { message: "Subjek harus diisi." }),
  message: z.string().min(10, { message: "Pesan minimal 10 karakter." }),
});

type ContactFormValues = z.infer<typeof formSchema>;

export default function ContactUsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Gagal mengirim pesan. Silakan coba lagi.');
        }

        toast({
          title: "Pesan Terkirim!",
          description: "Terima kasih atas masukan Anda. Pesan Anda telah kami terima.",
        });
        form.reset();
      } catch (error: any) {
        toast({
          title: "Terjadi Kesalahan",
          description: error.message || "Tidak dapat terhubung ke server.",
          variant: "destructive",
        });
      }
    });
  };

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
              Punya pertanyaan atau masukan? Jangan ragu untuk menghubungi kami melalui formulir di bawah ini. Kami akan menyimpan masukan Anda untuk perbaikan layanan. Anda juga bisa email kami langsung di <a href="mailto:support@tokoboost.com" className="underline text-primary">support@tokoboost.com</a>.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@anda.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjek</FormLabel>
                      <FormControl>
                        <Input placeholder="Subjek pesan Anda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pesan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tulis pesan Anda di sini..." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kirim Pesan
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
