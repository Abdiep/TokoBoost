
'use server';
/**
 * @fileOverview Generates a product flyer using AI, incorporating a product image.
 *
 * - generateProductFlyer - A function that generates a product flyer.
 * - GenerateProductFlyerInput - The input type for the generateProductFlyer function-
 * - GenerateProductFlyerOutput - The return type for the generateProductFlyer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductFlyerInputSchema = z.object({
  productImageUri: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateProductFlyerInput = z.infer<typeof GenerateProductFlyerInputSchema>;

const GenerateProductFlyerOutputSchema = z.object({
  flyerImageUri: z
    .string()
    .describe(
      'The generated product flyer image, as a data URI with MIME type and Base64 encoding.'
    ),
});
export type GenerateProductFlyerOutput = z.infer<typeof GenerateProductFlyerOutputSchema>;

export async function generateProductFlyer(input: GenerateProductFlyerInput): Promise<GenerateProductFlyerOutput> {
  return generateProductFlyerFlow(input);
}

const generateProductFlyerFlow = ai.defineFlow(
  {
    name: 'generateProductFlyerFlow',
    inputSchema: GenerateProductFlyerInputSchema,
    outputSchema: GenerateProductFlyerOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Buat sebuah flyer produk yang modern dan eksklusif berdasarkan gambar yang diberikan.
      Fokus hanya pada objek di dalam gambar. Jangan tambahkan teks apapun ke dalam flyer.
      Latar belakang harus dramatis, segar, dan hiper-realistis dengan pencahayaan kualitas studio.
      Image: {{media url="${input.productImageUri}"}}`,
       config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Gagal membuat gambar flyer. Model AI tidak mengembalikan gambar.');
    }

    return {flyerImageUri: media.url};
  }
);
