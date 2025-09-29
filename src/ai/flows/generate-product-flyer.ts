'use server';
/**
 * @fileOverview Generates a new background image based on a product description.
 *
 * - generateProductFlyer - A function that generates a background image.
 * - GenerateProductFlyerInput - The input type for the generateProductFlyer function.
 * - GenerateProductFlyerOutput - The return type for the generateProductFlyer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductFlyerInputSchema = z.object({
  productDescription: z.string().describe('The product description.'),
});
export type GenerateProductFlyerInput = z.infer<typeof GenerateProductFlyerInputSchema>;

const GenerateProductFlyerOutputSchema = z.object({
  backgroundImageUri: z
    .string()
    .describe(
      'The generated background image, as a data URI with MIME type and Base64 encoding.'
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
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `
        You are a background artist for product photography.
        Create a hyper-realistic, fresh, sharp, and clear background image for a product.
        The background should have soft and dramatic lighting.
        The background should be suitable for e-commerce and social media for small to medium-sized enterprises (UMKM) in Indonesia.
        The style should complement the product based on this description: "${input.productDescription}".
        
        **CRITICAL INSTRUCTIONS:**
        1.  **DO NOT** include any objects, subjects, products, or text in the image. This is a background ONLY.
        2.  The image must be a beautiful, professional, and appealing background.
        3.  The final image must be in a portrait aspect ratio (9:16).
      `,
    });

    if (!media?.url) {
      throw new Error('Failed to generate background image.');
    }

    return {backgroundImageUri: media.url};
  }
);
