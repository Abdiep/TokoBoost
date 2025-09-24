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

const generateProductFlyerPrompt = ai.definePrompt({
  name: 'generateProductFlyerPrompt',
  input: {schema: GenerateProductFlyerInputSchema},
  output: {schema: GenerateProductFlyerOutputSchema},
  prompt: `You are an expert marketing material designer. Your goal is to create a visually appealing and effective product flyer.

  Use the following product image and captions to generate the flyer.

  Product Image: {{media url=productImageUri}}
  Caption 1: {{{caption1}}}
  Caption 2: {{{caption2}}}
  Caption 3: {{{caption3}}}

  Consider the best placement and emphasis of the marketing messages. Return the flyer as a data URI.
  `,
});

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
        {text: `Generate a product flyer incorporating the product image and the following captions: ${input.caption1}, ${input.caption2}, ${input.caption3}`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {flyerImageUri: media.url!};
  }
);
