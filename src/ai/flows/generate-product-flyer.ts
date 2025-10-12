'use server';
/**
 * @fileOverview Generates a product flyer by replacing the background of a user-provided image.
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
      prompt: [
        {media: {url: input.productImage}},
        {text: `
          **CRITICAL INSTRUCTIONS:**
          1.  You are an AI image editor. Your only task is to edit the provided image.
          2.  **IDENTIFY THE MAIN SUBJECT** of the image. The main subject is the product itself.
          3.  **DO NOT CHANGE, ALTER, OR REDRAW THE MAIN SUBJECT.** It must be preserved exactly as it is in the original image.
          4.  **COMPLETELY REMOVE THE ORIGINAL BACKGROUND** and replace it with a new one.
          5.  The new background must be hyper-realistic, fresh, sharp, and clear with soft and dramatic lighting. It should be suitable for e-commerce and social media for small enterprises (UMKM) in Indonesia, based on the product description: "${input.productDescription}".
          6.  If Background dark, make it bright.
          7.  If the object in the image is a hand, make sure it is removed and keep the focus on the object.
          8.  If the object is food or drink, make it look attractive to enjoy.
          9.  If the object is shoes, sandals, slippers, high heels, or the like, use the model of wearing them and combine it with appropriate clothing or accessories.
          10. If the object is clothing, make sure you use a model and combine it with appropriate clothing or accessories.
          11. If the object is underwear such as panties, bras, lingeries, and the like, make sure the image is visualized without a model but still visualized elegantly and luxuriously.
          12. If the object is accessories that are worn, such as: hats, beanies, helmets, glasses, earrings, necklaces, bracelets and the like, use models to wear them elegantly and attractively, make sure to focus and zoom in on these accessories.
          13. If the object is kitchen equipments and utensils, use a model to demonstrate how to use it, focus and zoom in on the object.
          14. If the object is an automotive spare part or accessory, visualize it according to the automotive type.
          15. The final image must be in a portrait aspect ratio (9:16).
          16.  **DO NOT ADD ANY TEXT** to the final image.
        `},
      ],
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
