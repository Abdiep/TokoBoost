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
  productImage: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
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
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: `
        You are an expert AI image editor for Indonesian UMKM (small to medium-sized enterprises).
        Your task is to create a professional product flyer by **editing the provided image**, NOT creating a new one.

        **CRITICAL INSTRUCTIONS:**
        1.  **Identify the Main Subject:** Analyze the user's uploaded image and identify the main product object.
        2.  **DO NOT CHANGE THE SUBJECT:** You MUST keep the original product object exactly as it is in the uploaded image. Do not replace it, redraw it, or alter its appearance.
        3.  **Remove and Replace Background:** Completely remove the original background and generate a brand new one.
        4.  **New Background Style:** The new background must be hyper-realistic, fresh, sharp, and clear. It should complement the product's character based on the description: "${input.productDescription}".
        5.  **Lighting:** Apply soft and dramatic lighting to highlight the **original subject**, making it look appealing.
        6.  **Final Image Style:** The final image must be high-quality and professional, suitable for e-commerce and social media.
        7.  **Aspect Ratio:** The final image must be in a portrait aspect ratio (9:16).
        8.  **NO TEXT:** The final generated image must NOT contain any text, words, or letters.

        **Inputs:**
        - **Product Image to Edit:** {{media url=productImage}}
        - **Product Description for Context:** ${input.productDescription}
      `,
       config: {
        responseModalities: ['TEXT', 'IMAGE'],
       },
    });

    if (!media?.url) {
      throw new Error('Failed to generate flyer image.');
    }

    return {flyerImageUri: media.url};
  }
);
