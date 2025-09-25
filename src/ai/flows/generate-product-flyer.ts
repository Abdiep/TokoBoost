'use server';
/**
 * @fileOverview Generates a product flyer using AI, incorporating a product image and captions.
 *
 * - generateProductFlyer - A function that generates a product flyer.
 * - GenerateProductFlyerInput - The input type for the generateProductFlyer function.
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
  caption1: z.string().describe('The first marketing caption for the product.'),
  caption2: z.string().describe('The second marketing caption for the product.'),
  caption3: z.string().describe('The third marketing caption for the product.'),
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
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: input.productImageUri}},
        {text: 'Create a modern and exclusive product flyer. Identify the main object and any relevant supporting objects. Do not add any text. Remove the original background and replace it with a dramatic, fresh, and hyper-realistic one. Use soft but clear lighting to make the image look sharp and fresh.'},
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    if (!media.url) {
      throw new Error('Failed to generate flyer image.');
    }

    return {flyerImageUri: media.url};
  }
);
