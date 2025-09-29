'use server';
/**
 * @fileOverview Generates a product flyer using AI, incorporating a product image and description.
 *
 * - generateProductFlyer - A function that generates a product flyer.
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
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Based on the following product description: "${input.productDescription}", create a product flyer for Indonesian UMKM to be used on e-commerce and social media. The image must be hyper-realistic, fresh, sharp, and clear. The lighting should be soft and dramatic to highlight the product. The background should be a new, complementary one that matches the product's character. The final image should be in a portrait aspect ratio (9:16). The final generated image must not contain any text, words, or letters.`,
    });

    if (!media?.url) {
      throw new Error('Failed to generate flyer image.');
    }

    return {flyerImageUri: media.url};
  }
);
