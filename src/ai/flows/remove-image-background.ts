'use server';
/**
 * @fileOverview Removes the background from a product image.
 *
 * - removeImageBackground - A function that removes the background of an image.
 * - RemoveImageBackgroundInput - The input type for the removeImageBackground function.
 * - RemoveImageBackgroundOutput - The return type for the removeImageBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RemoveImageBackgroundInputSchema = z.object({
  productImage: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RemoveImageBackgroundInput = z.infer<typeof RemoveImageBackgroundInputSchema>;

const RemoveImageBackgroundOutputSchema = z.object({
  productImageUri: z
    .string()
    .describe(
      'The product image with the background removed (transparent), as a data URI with MIME type and Base64 encoding.'
    ),
});
export type RemoveImageBackgroundOutput = z.infer<typeof RemoveImageBackgroundOutputSchema>;

export async function removeImageBackground(input: RemoveImageBackgroundInput): Promise<RemoveImageBackgroundOutput> {
  return removeImageBackgroundFlow(input);
}

const removeImageBackgroundFlow = ai.defineFlow(
  {
    name: 'removeImageBackgroundFlow',
    inputSchema: RemoveImageBackgroundInputSchema,
    outputSchema: RemoveImageBackgroundOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: `
        You are an expert AI image editor.
        Your only task is to **perfectly remove the background** from the provided image, leaving only the main subject.
        The output image MUST have a transparent background.
        Do not alter the subject in any way.

        Image to edit: {{media url=productImage}}
      `,
       config: {
        responseModalities: ['TEXT', 'IMAGE'],
       },
    });

    if (!media?.url) {
      throw new Error('Failed to remove image background.');
    }

    return {productImageUri: media.url};
  }
);
